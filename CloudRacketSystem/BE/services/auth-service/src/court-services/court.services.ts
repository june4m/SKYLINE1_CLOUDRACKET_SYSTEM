import { PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../../../../shared/config/dynamodb.config'
import { CourtDTO } from '../court-services/court.schema'
import { calculateDistance } from '../../../../shared/utils/haversine'
import { v4 as uuidv4 } from 'uuid'

const TABLE_NAME = 'CourtData'
const CLUB_TABLE_NAME = 'ClubData'

export class CourtService {
  async getCourtById(court_id: string) {
    console.log('getCourtById Services')
    try {
      const cmd = new GetCommand({
        TableName: TABLE_NAME,
        Key: { court_id }
      })

      const result = await dynamoClient.send(cmd)
      return result.Item || null
    } catch (error) {
      console.error('CourtService.getCourtById error:', error)
      throw new Error('Failed to fetch court')
    }
  }

  async getAllCourts() {
    try {
      const cmd = new ScanCommand({
        TableName: TABLE_NAME
      })

      const result = await dynamoClient.send(cmd)
      return result.Items || []
    } catch (error) {
      console.error('CourtService.getAllCourts error:', error)
      throw new Error('Failed to fetch all courts')
    }
  }

  async getAvailableCourts() {
    try {
      const cmd = new ScanCommand({
        TableName: 'CourtData',
        FilterExpression: 'court_status = :status',
        ExpressionAttributeValues: {
          ':status': 'available'
        }
      })

      const result = (await dynamoClient.send(cmd)) as any
      return result.Items ?? []
    } catch (error) {
      console.error('CourtService.getAvailableCourts error:', error)
      throw new Error('Failed to fetch available courts')
    }
  }

  async searchCourtsByClubInfo(filters: { club_name?: string; club_district?: string; limitClubs?: number }) {
    try {
      const { club_name, club_district, limitClubs = 50 } = filters

      if (!club_name && !club_district) {
        throw new Error('club_name or club_district is required')
      }

      // Build filter for ClubData scan (OR)
      const filterParts: string[] = []
      const exprValues: Record<string, any> = {}

      if (club_name) {
        filterParts.push('contains(club_name, :club_name)')
        exprValues[':club_name'] = club_name
      }
      if (club_district) {
        filterParts.push('contains(club_district, :club_district)')
        exprValues[':club_district'] = club_district
      }

      const clubScanInput: any = {
        TableName: 'ClubData',
        ProjectionExpression:
          'club_id, club_name, club_district, open_time, close_time, club_address, num_courts, popularity_score, price, rating_avg, rating_counts',
        Limit: limitClubs
      }

      if (filterParts.length > 0) {
        clubScanInput.FilterExpression = filterParts.join(' AND ')
        clubScanInput.ExpressionAttributeValues = exprValues
      }

      console.log('[searchCourtsByClubInfo] clubScanInput:', JSON.stringify(clubScanInput))
      const clubRes = (await dynamoClient.send(new ScanCommand(clubScanInput))) as any
      const clubs = (clubRes.Items ?? []) as any[]

      if (!clubs.length) {
        console.log('[searchCourtsByClubInfo] no clubs found')
        return []
      }

      const clubIds: string[] = clubs.map((c) => c.club_id).filter(Boolean)
      console.log('[searchCourtsByClubInfo] found clubIds:', clubIds)

      // -----------------------------
      // SAFER APPROACH: scan CourtData fully (or by small pages) and FILTER IN APP by clubIds
      // This avoids constructing complex FilterExpression OR clauses that can behave unexpectedly.
      // -----------------------------
      const courtScanInput: any = {
        TableName: 'CourtData',
        ProjectionExpression: 'court_id, club_id, court_name, court_status'
      }

      console.log('[searchCourtsByClubInfo] scanning CourtData (will filter in app)')
      const courtRes = (await dynamoClient.send(new ScanCommand(courtScanInput))) as any
      const allCourts = (courtRes.Items ?? []) as any[]

      // filter in app
      const courts = allCourts.filter((ct) => clubIds.includes(ct.club_id))

      // Group courts by club_id
      const courtsByClub: Record<string, any[]> = {}
      for (const c of courts) {
        if (!c?.club_id) continue
        if (!courtsByClub[c.club_id]) courtsByClub[c.club_id] = []
        courtsByClub[c.club_id].push(c)
      }

      const result = clubs.map((club) => ({
        club,
        courts: courtsByClub[club.club_id] ?? []
      }))

      return result
    } catch (err) {
      console.error('CourtService.searchCourtsByClubInfo error:', err)
      throw new Error('Failed to search courts by club info')
    }
  }

  async createCourt(payload: CourtDTO) {
    const { club_id, court_name, court_status = 'available' } = payload

    if (!club_id || !court_name) {
      throw new Error('club_id and court_name are required')
    }

    // Kiểm tra club_id có tồn tại
    const clubExists = await dynamoClient.send(new GetCommand({ TableName: 'ClubData', Key: { club_id } }))
    if (!clubExists.Item) {
      throw new Error(`Club with id ${club_id} does not exist`)
    }

    const court_id = uuidv4()
    const item = { court_id, club_id, court_name, court_status }

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: 'attribute_not_exists(court_id)'
        })
      )
      return item
    } catch (err: any) {
      console.error('CourtService.createCourt error:', err)
      throw new Error('Failed to create court')
    }
  }

  /**
   * Get nearby courts based on user location using Haversine formula
   * Note: This implementation assumes clubs have latitude and longitude fields
   * For production, consider using Amazon Location Service for better performance
   */
  async getNearbyCourts(userLat: number, userLng: number, radiusKm: number = 10) {
    try {
      console.log(`[CourtService.getNearbyCourts] Searching within ${radiusKm}km of (${userLat}, ${userLng})`)

      // Step 1: Get all clubs with their location data
      const clubScanInput = {
        TableName: CLUB_TABLE_NAME,
        ProjectionExpression:
          'club_id, club_name, club_address, club_district, open_time, close_time, num_courts, price, rating_avg, rating_counts, popularity_score, latitude, longitude'
      }

      const clubRes = await dynamoClient.send(new ScanCommand(clubScanInput))
      const clubs = (clubRes.Items || []) as any[]

      console.log(`[CourtService.getNearbyCourts] Found ${clubs.length} clubs in database`)

      // Step 2: Filter clubs by distance and calculate distance for each
      const clubsWithDistance = clubs
        .map((club) => {
          // Skip clubs without location data
          if (!club.latitude || !club.longitude) {
            console.log(`[CourtService.getNearbyCourts] Club ${club.club_id} missing lat/lng, skipping`)
            return null
          }

          const distance = calculateDistance(userLat, userLng, club.latitude, club.longitude)

          return {
            ...club,
            distance_km: Math.round(distance * 100) / 100 // Round to 2 decimal places
          }
        })
        .filter((club) => club !== null && club.distance_km <= radiusKm) as any[]

      console.log(`[CourtService.getNearbyCourts] Found ${clubsWithDistance.length} clubs within ${radiusKm}km`)

      // Step 3: Sort by distance (nearest first)
      clubsWithDistance.sort((a, b) => a.distance_km - b.distance_km)

      // Step 4: Get courts for each nearby club
      const clubIds = clubsWithDistance.map((club) => club.club_id)

      if (clubIds.length === 0) {
        return []
      }

      // Get all courts
      const courtScanInput = {
        TableName: TABLE_NAME,
        ProjectionExpression: 'court_id, club_id, court_name, court_status'
      }

      const courtRes = await dynamoClient.send(new ScanCommand(courtScanInput))
      const allCourts = (courtRes.Items || []) as any[]

      // Filter courts by nearby club IDs
      const nearbyCourts = allCourts.filter((court) => clubIds.includes(court.club_id))

      console.log(`[CourtService.getNearbyCourts] Found ${nearbyCourts.length} courts in nearby clubs`)

      // Step 5: Group courts by club and combine data
      const courtsByClub: Record<string, any[]> = {}
      for (const court of nearbyCourts) {
        if (!courtsByClub[court.club_id]) {
          courtsByClub[court.club_id] = []
        }
        courtsByClub[court.club_id].push(court)
      }

      // Step 6: Build final result with club info and courts
      const result = clubsWithDistance.map((club) => ({
        club_id: club.club_id,
        club_name: club.club_name,
        club_address: club.club_address,
        club_district: club.club_district,
        distance_km: club.distance_km,
        latitude: club.latitude,
        longitude: club.longitude,
        open_time: club.open_time,
        close_time: club.close_time,
        price: club.price,
        rating_avg: club.rating_avg,
        rating_counts: club.rating_counts,
        popularity_score: club.popularity_score,
        num_courts: club.num_courts,
        courts: courtsByClub[club.club_id] || []
      }))

      return result
    } catch (error) {
      console.error('CourtService.getNearbyCourts error:', error)
      throw new Error('Failed to fetch nearby courts')
    }
  }
}

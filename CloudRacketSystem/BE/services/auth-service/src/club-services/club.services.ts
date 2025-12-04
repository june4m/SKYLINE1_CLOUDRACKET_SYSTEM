// src/services/club.services.ts
import { PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../../../../shared/config/dynamodb.config'
import { ClubDTO } from '../club-services/club.schema'
import { v4 as uuidv4 } from 'uuid'

const TABLE_NAME = 'ClubData'

export class ClubService {
  async createClub(payload: ClubDTO) {
    const { club_name, club_district, club_address, open_time, close_time, num_courts } = payload

    if (!club_name || !club_district || !club_address || !open_time || !close_time || num_courts === undefined) {
      throw new Error('Missing required fields')
    }

    const club_id = uuidv4()
    const item = {
      club_id,
      ...payload,
      popularity_score: payload.popularity_score ?? 0,
      price: payload.price ?? 0,
      rating_avg: payload.rating_avg ?? 0,
      rating_counts: payload.rating_counts ?? 0
    }

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: 'attribute_not_exists(club_id)'
        })
      )
      return item
    } catch (err: any) {
      console.error('ClubService.createClub error:', err)
      throw new Error('Failed to create club')
    }
  }

  async getClubById(club_id: string) {
    try {
      const res = await dynamoClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { club_id } }))
      return res.Item || null
    } catch (err) {
      console.error('ClubService.getClubById error:', err)
      throw new Error('Failed to fetch club')
    }
  }

  async getAllClubs() {
    try {
      const res = await dynamoClient.send(new ScanCommand({ TableName: TABLE_NAME }))
      return res.Items || []
    } catch (err) {
      console.error('ClubService.getAllClubs error:', err)
      throw new Error('Failed to fetch clubs')
    }
  }
}

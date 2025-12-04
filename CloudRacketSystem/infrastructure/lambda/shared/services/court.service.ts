import { PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURTS_TABLE_NAME || 'CourtData';

export interface CourtDTO {
  club_id: string;
  court_name: string;
  court_status?: string;
}

export class CourtService {
  async getCourtById(court_id: string) {
    try {
      const cmd = new GetCommand({
        TableName: TABLE_NAME,
        Key: { court_id },
      });

      const result = await dynamoClient.send(cmd);
      return result.Item || null;
    } catch (error) {
      console.error('CourtService.getCourtById error:', error);
      throw new Error('Failed to fetch court');
    }
  }

  async getAllCourts() {
    try {
      const cmd = new ScanCommand({
        TableName: TABLE_NAME,
      });

      const result = await dynamoClient.send(cmd);
      return result.Items || [];
    } catch (error) {
      console.error('CourtService.getAllCourts error:', error);
      throw new Error('Failed to fetch all courts');
    }
  }

  async getAvailableCourts() {
    try {
      const cmd = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'court_status = :status',
        ExpressionAttributeValues: {
          ':status': 'available',
        },
      });

      const result = await dynamoClient.send(cmd);
      return result.Items ?? [];
    } catch (error) {
      console.error('CourtService.getAvailableCourts error:', error);
      throw new Error('Failed to fetch available courts');
    }
  }

  async searchCourtsByClubInfo(filters: { club_name?: string; club_district?: string; limitClubs?: number }) {
    try {
      const { club_name, club_district, limitClubs = 50 } = filters;

      if (!club_name && !club_district) {
        throw new Error('club_name or club_district is required');
      }

      const filterParts: string[] = [];
      const exprValues: Record<string, any> = {};

      if (club_name) {
        // Tìm gần đúng cho tên club
        filterParts.push('contains(club_name, :club_name)');
        exprValues[':club_name'] = club_name;
      }
      if (club_district) {
        // Tìm chính xác cho quận/huyện
        filterParts.push('club_district = :club_district');
        exprValues[':club_district'] = club_district;
      }

      const clubScanInput: any = {
        TableName: 'ClubData',
        ProjectionExpression:
          'club_id, club_name, club_district, open_time, close_time, club_address, num_courts, popularity_score, price, rating_avg, rating_counts',
        Limit: limitClubs,
      };

      if (filterParts.length > 0) {
        clubScanInput.FilterExpression = filterParts.join(' AND ');
        clubScanInput.ExpressionAttributeValues = exprValues;
      }

      const clubRes = await dynamoClient.send(new ScanCommand(clubScanInput));
      const clubs = clubRes.Items ?? [];

      if (!clubs.length) {
        return [];
      }

      const clubIds: string[] = clubs.map((c: any) => c.club_id).filter(Boolean);

      const courtScanInput: any = {
        TableName: TABLE_NAME,
        ProjectionExpression: 'court_id, club_id, court_name, court_status',
      };

      const courtRes = await dynamoClient.send(new ScanCommand(courtScanInput));
      const allCourts = courtRes.Items ?? [];

      const courts = allCourts.filter((ct: any) => clubIds.includes(ct.club_id));

      const courtsByClub: Record<string, any[]> = {};
      for (const c of courts) {
        if (!(c as any)?.club_id) continue;
        if (!courtsByClub[(c as any).club_id]) courtsByClub[(c as any).club_id] = [];
        courtsByClub[(c as any).club_id].push(c);
      }

      const result = clubs.map((club: any) => ({
        club,
        courts: courtsByClub[club.club_id] ?? [],
      }));

      return result;
    } catch (err) {
      console.error('CourtService.searchCourtsByClubInfo error:', err);
      throw new Error('Failed to search courts by club info');
    }
  }

  async createCourt(payload: CourtDTO) {
    const { club_id, court_name, court_status = 'available' } = payload;

    if (!club_id || !court_name) {
      throw new Error('club_id and court_name are required');
    }

    const clubExists = await dynamoClient.send(new GetCommand({ TableName: 'ClubData', Key: { club_id } }));
    if (!clubExists.Item) {
      throw new Error(`Club with id ${club_id} does not exist`);
    }

    const court_id = uuidv4();
    const item = { court_id, club_id, court_name, court_status };

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: 'attribute_not_exists(court_id)',
        })
      );
      return item;
    } catch (err: any) {
      console.error('CourtService.createCourt error:', err);
      throw new Error('Failed to create court');
    }
  }

  async markCourtBookedIfAvailable(court_id: string) {
    try {
      const updateCmd = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { court_id },
        UpdateExpression: 'SET court_status = :booked',
        ConditionExpression: 'court_status = :avail',
        ExpressionAttributeValues: {
          ':booked': 'booked',
          ':avail': 'available',
        },
        ReturnValues: 'ALL_NEW',
      });

      const res = await dynamoClient.send(updateCmd);
      return res.Attributes ?? null;
    } catch (err: any) {
      if (err?.name === 'ConditionalCheckFailedException') {
        throw new Error('Court is not available for booking');
      }
      console.error('CourtService.markCourtBookedIfAvailable error:', err);
      throw new Error('Failed to mark court as booked');
    }
  }

  async rollbackCourtToAvailable(court_id: string) {
    try {
      const updateCmd = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { court_id },
        UpdateExpression: 'SET court_status = :avail',
        ExpressionAttributeValues: {
          ':avail': 'available',
        },
      });
      await dynamoClient.send(updateCmd);
      return true;
    } catch (err) {
      console.error('CourtService.rollbackCourtToAvailable error:', err);
      return false;
    }
  }
}

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'ClubData';

export class ClubService {
  async getClubById(club_id: string) {
    try {
      const cmd = new GetCommand({
        TableName: TABLE_NAME,
        Key: { club_id },
      });

      const result = await dynamoClient.send(cmd);
      return result.Item || null;
    } catch (error) {
      console.error('ClubService.getClubById error:', error);
      throw new Error('Failed to fetch club');
    }
  }
}

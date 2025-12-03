import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../../../../shared/config/dynamodb.config'

const TABLE_NAME = process.env.COURT_TABLE_NAME || 'CourtData'

export class CourtService {
  async getCourtById(court_id: string) {
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
}
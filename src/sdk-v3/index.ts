import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { BaseDynamoStore, DynamoStoreProps } from '../dynamodb-store';

export class DynamoStore extends BaseDynamoStore {
  constructor(private store: DynamoDBDocumentClient, opts: DynamoStoreProps) {
    super(opts);
  }

  protected async update(input: {
    Key: any;
    UpdateExpression: string;
    ExpressionAttributeNames: any;
    ExpressionAttributeValues: any;
    TableName: string;
  }): Promise<any> {
    const command = new UpdateCommand(input);
    await this.store.send(command);
  }

  protected async get(input: {
    Key: any;
    TableName: string;
  }): Promise<{ Item?: { timestamps: readonly number[] } | undefined }> {
    const command = new GetCommand(input);
    return this.store.send(command) as any;
  }
}

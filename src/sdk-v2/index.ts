// For sdk v2.
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { BaseDynamoStore, DynamoStoreProps } from '../dynamodb-store';

export class DynamoStore extends BaseDynamoStore {
  constructor(private store: DocumentClient, opts: DynamoStoreProps) {
    super(opts);
  }

  protected async update(input: {
    Key: any;
    UpdateExpression: string;
    ExpressionAttributeNames: any;
    ExpressionAttributeValues: any;
    TableName: string;
  }): Promise<any> {
    await this.store.update(input).promise();
  }

  protected async get(input: {
    Key: any;
    TableName: string;
  }): Promise<{ Item?: { timestamps: readonly number[] } | undefined }> {
    const res = await this.store.get(input).promise();
    return {
      Item: {
        timestamps: res.Item?.timestamps || [],
      },
    };
  }
}

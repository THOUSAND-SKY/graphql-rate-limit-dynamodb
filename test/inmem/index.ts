import { InMemoryStore } from 'graphql-rate-limit';
import { BaseDynamoStore, DynamoStoreProps } from '../../src/dynamodb-store';

/** For testing. */
export class DynamoStore extends BaseDynamoStore {
  /** For testing. */
  constructor(public store: InMemoryStore, opts: DynamoStoreProps) {
    super({
      ...opts,
      pk: 'pk',
      sk: { sk: 'sk', value: '-' },
    });
  }

  protected async update(input: {
    Key: any;
    UpdateExpression: string;
    ExpressionAttributeNames: any;
    ExpressionAttributeValues: any;
    TableName: string;
  }): Promise<any> {
    this.store.setForIdentity(
      {
        contextIdentity: input.Key.pk,
        fieldIdentity: input.Key.sk,
      },
      input.ExpressionAttributeValues[':timestamps']
    );
  }
  protected async get({
    Key,
  }: {
    Key: any;
    TableName: string;
  }): Promise<{ Item?: { timestamps: readonly number[] } | undefined }> {
    const thing = this.store.getForIdentity({
      contextIdentity: Key.pk,
      fieldIdentity: Key.sk,
    });
    return {
      Item: {
        timestamps: thing,
      },
    };
  }
}

import { DynamoStore } from '../src/sdk-v3';
import { DynamoStore as InMem } from './inmem';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { InMemoryStore } from 'graphql-rate-limit';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

test('DynamoStore sets and gets correct timestamps', async () => {
  ddbMock.on(UpdateCommand).resolves({});

  const ddbStore = new DynamoStore(
    DynamoDBDocumentClient.from(new DynamoDBClient({})),
    {
      tableName: 'tableName',
      pk: 'pk',
      sk: { sk: 'sk', value: 'skValue' },
      ttlField: 'ttlField',
    }
  );

  const expectSet = async (
    { contextIdentity, fieldIdentity }: any,
    value: any
  ) => {
    ddbMock.on(UpdateCommand).callsFake(input => {
      expect(input.Key).toMatchObject({
        pk: `ddb-graphql-rate-limit-store-id::${contextIdentity}:${fieldIdentity}`,
        sk: 'skValue',
      });
      expect(input.UpdateExpression).toEqual(
        'SET #timestamps = :timestamps , #ttlField = :ttlField'
      );
      expect(input.ExpressionAttributeValues[':ttlField']).toBeTruthy();
      expect(input.ExpressionAttributeNames['#ttlField']).toEqual('ttlField');
      expect(input.ExpressionAttributeValues[':timestamps']).toStrictEqual(
        value
      );
    });
  };
  const expectGet = async (
    { contextIdentity, fieldIdentity }: any,
    value: any
  ) => {
    ddbMock.on(GetCommand).callsFake(input => {
      expect(input.Key).toMatchObject({
        pk: `ddb-graphql-rate-limit-store-id::${contextIdentity}:${fieldIdentity}`,
        sk: 'skValue',
      });
      return {
        Item: {
          timestamps: value,
        },
      };
    });
  };

  expectSet({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [1, 2, 3]);
  await ddbStore.setForIdentity(
    { contextIdentity: 'foo', fieldIdentity: 'bar' },
    [1, 2, 3],
    1000
  );

  expectGet(
    {
      contextIdentity: 'foo',
      fieldIdentity: 'bar',
    },
    [1, 2, 3]
  );
  expect(
    await ddbStore.getForIdentity({
      contextIdentity: 'foo',
      fieldIdentity: 'bar',
    })
  ).toStrictEqual([1, 2, 3]);

  await expectSet({ contextIdentity: 'foo', fieldIdentity: 'bar2' }, [4, 5]);
  await ddbStore.setForIdentity(
    { contextIdentity: 'foo', fieldIdentity: 'bar2' },
    [4, 5],
    1000
  );

  await expectGet(
    {
      contextIdentity: 'foo',
      fieldIdentity: 'bar2',
    },
    [4, 5]
  );
  expect(
    await ddbStore.getForIdentity({
      contextIdentity: 'foo',
      fieldIdentity: 'bar2',
    })
  ).toStrictEqual([4, 5]);

  await expectSet({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [10, 20]);
  await ddbStore.setForIdentity(
    { contextIdentity: 'foo', fieldIdentity: 'bar' },
    [10, 20],
    1000
  );
  await expectGet(
    {
      contextIdentity: 'foo',
      fieldIdentity: 'bar',
    },
    [10, 20]
  );
  expect(
    await ddbStore.getForIdentity({
      contextIdentity: 'foo',
      fieldIdentity: 'bar',
    })
  ).toStrictEqual([10, 20]);
});

test('DynamoStore sets and gets correct timestamps - inmem comparison', async () => {
  const store = new InMem(new InMemoryStore(), {
    tableName: 'tableName',
    pk: 'pk',
    sk: { sk: 'sk', value: 'skValue' },
    ttlField: 'ttlField',
  });

  store.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [
    1,
    2,
    3,
  ]);
  expect(
    await store.getForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' })
  ).toStrictEqual([1, 2, 3]);

  store.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar2' }, [
    4,
    5,
  ]);
  expect(
    await store.getForIdentity({
      contextIdentity: 'foo',
      fieldIdentity: 'bar2',
    })
  ).toStrictEqual([4, 5]);

  store.setForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' }, [
    10,
    20,
  ]);
  expect(
    await store.getForIdentity({ contextIdentity: 'foo', fieldIdentity: 'bar' })
  ).toStrictEqual([10, 20]);
});

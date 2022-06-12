# graphql-rate-limit-dynamodb

AWS Dynamodb backend for [graphql-rate-limit](https://www.npmjs.com/package/graphql-rate-limit) package.

## Usage

```ts
// sdk v2
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DynamoStoreV2 } from 'graphql-rate-limit-dynamodb';
// sdk v3
// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { DynamoStoreV3 } from "graphql-rate-limit-dynamodb";

const UserRateLimited = createRateLimitRule({
  identifyContext: ctx => ctx.user.id,
  store: new DynamoStoreV2(new DocumentClient(getOptionsSomehow()), {
    tableName: 'my-table',
    pk: 'pk',
    sk: { sk: 'sk', value: 'any-sane-static-value-for-sk' }, // If table uses sort key.
    ttlField: "ttl-field's-name", // ttl field is recommended, else there will lots of rows.
  }),
});
```

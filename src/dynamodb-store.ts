import { Identity, Store } from 'graphql-rate-limit';

export type DynamoStoreProps = {
  tableName: string;
  /** Partition key field name. Example: "pk". */
  pk: string;
  /**
   * The sk isn't used, but since dynamo may need it, you can pass an sk with any value here.
   * Example: `{ sk: "sk", value: "-" }` or `{ sk: "sk", value: 0 }`.
   * `sk` will then have value `-` (or `0`) for every row.
   */
  sk?: { sk: string; value: any };
  /**
   * Pass the name of the ttlField here, if you have it. Otherwise all
   * the rows will hang around forever. The value of the ttl field will be a
   * number. Example: "ttl".
   */
  ttlField?: string;
};

abstract class BaseDynamoStore implements Store {
  private readonly nameSpacedKeyPrefix: string =
    'ddb-graphql-rate-limit-store-id::';
  private _tableName: string;
  private pk: string;
  private sk?: { sk: string; value: string | number };
  private _ttlField: string | undefined;

  public constructor(opts: DynamoStoreProps) {
    this._tableName = opts.tableName;
    this.pk = opts.pk;
    this.sk = opts.sk;
    this._ttlField = opts.ttlField;
  }

  protected abstract update(input: {
    Key: any;
    UpdateExpression: string;
    ExpressionAttributeNames: any;
    ExpressionAttributeValues: any;
    TableName: string;
  }): Promise<any>;
  protected abstract get(input: {
    Key: any;
    TableName: string;
  }): Promise<{ Item?: { timestamps: readonly number[] } }>;

  public async setForIdentity(
    identity: Identity,
    timestamps: readonly number[],
    windowMs?: number
  ): Promise<void> {
    const expiry =
      windowMs && this.secs(Date.now() + windowMs - Math.max(...timestamps));

    this.update({
      Key: this.generateNamedSpacedKey(identity),
      UpdateExpression:
        'SET #timestamps = :timestamps' + this.getTtl(expiry).updates,
      ExpressionAttributeNames: {
        ...this.getTtl(expiry).names,
        '#timestamps': 'timestamps',
      },
      ExpressionAttributeValues: {
        ...this.getTtl(expiry).values,
        ':timestamps': timestamps,
      },
      TableName: this._tableName,
    });
  }

  private getTtl(expiry?: number) {
    if (this._ttlField && expiry) {
      return {
        names: { '#ttlField': this._ttlField },
        values: { ':ttlField': this.secs(expiry * 1000 + Date.now()) },
        updates: ' , #ttlField = :ttlField',
      };
    }
    return {
      names: {} as any,
      values: {} as any,
      updates: '',
    };
  }

  public async getForIdentity(identity: Identity): Promise<readonly number[]> {
    const res = await this.get({
      Key: this.generateNamedSpacedKey(identity),
      TableName: this._tableName,
    });
    return res.Item?.timestamps || [];
  }

  private secs(num: number) {
    return Math.ceil(num / 1000);
  }

  private readonly generateNamedSpacedKey = (
    identity: Identity
  ): Record<string | number, string | number> => {
    return {
      [this
        .pk]: `${this.nameSpacedKeyPrefix}${identity.contextIdentity}:${identity.fieldIdentity}`,
      ...(this.sk && { [this.sk.sk]: this.sk.value }),
    };
  };
}

export { BaseDynamoStore };

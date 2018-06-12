import * as mongoose from 'mongoose';
import * as config from 'config';

export class RemoteDataModel {

  public async addRemoteData(remoteData: RemoteData): Promise<RemoteData> {
    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');

    remoteData.params.forEach((param: RemoteParam) => {
      param['remote_key'] = remoteData.remote_key;
      param['remote_data_timestamp'] = param.timestamp;
      delete param.timestamp;
    });

    await remoteDataModel.insertMany(remoteData.params);
    return Promise.resolve(remoteData);
  }

  /**
   * Return all array of finances with hardware_address
   * Get last finance remote data by codes and group by hardware_address,
   * @param remoteKey
   * @param encashmentCode
   * @param totalCode
   * @param spentCode
   * @param bonusCode
   */
  public async getRemoteDataFinances(
    remoteKey: string,
    encashmentCode: string,
    totalCode: string,
    spentCode: string,
    bonusCode: string,
  ): Promise<RemoteDataFinance[]> {

    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');
    const remoteDataFinance: RemoteDataFinance[] = await remoteDataModel.aggregate([
      {
        $match: {
          remote_key: new mongoose.Types.ObjectId(remoteKey),
          code: { $in: [encashmentCode, totalCode, spentCode, bonusCode] }
        }
      },
      { $sort: { remote_data_timestamp: -1 } },
      {
        $group: {
          _id: { hardware_address: '$hardware_address', code: '$code' },
          hardware_address: { $first: '$hardware_address' },
          code: { $first: '$code' },
          value: { $first: '$value' }
        }
      },
      {
        $group: {
          _id: '$hardware_address',
          hardware_address: { $first: '$hardware_address' },
          finance: { $push: { code: '$code', value: '$value' } }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]) as RemoteDataFinance[];
    return Promise.resolve(remoteDataFinance);
  }

  /**
   * Aggregate romoteData by remote_key, today(startDay, endDay) and totalCode key
   * and return hash with hardware_address key and total finance array for current day
   * @param remoteKey
   */
  public async getCurrentDayFinances(remoteKey: string): Promise<RemoteDataCurrentDayHash> {
    const { totalCode } = config.get('finance');

    const startDay: Date = new Date();
    startDay.setHours(0, 0, 0, 0);

    const endDay: Date = new Date(startDay);
    endDay.setHours(23, 59, 59, 999);

    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');
    const remoteData: { hardware_address: string, values: string[] }[] = await remoteDataModel.aggregate([
      {
        $match: {
          $and: [
            { remote_key: new mongoose.Types.ObjectId(remoteKey) },
            { code: totalCode },
            { remote_data_timestamp: { $gte: startDay, $lt: endDay } },
          ]
        }
      },
      { $sort: { remote_data_timestamp: 1 } },
      {
        $group: {
          _id: '$hardware_address',
          hardware_address: { $first: '$hardware_address' },
          values: { $push: '$value' }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]) as { hardware_address: string, values: string[] }[];

    const currentDayHash: RemoteDataCurrentDayHash = remoteData
      .reduce((acc: RemoteDataCurrentDayHash, next: { hardware_address: string, values: string[] }) => {
        acc[next.hardware_address] = next.values;
        return acc;
      }, {});

    return Promise.resolve(currentDayHash);
  }

  // tslint:disable-next-line
  public async getParamCodeValue(remoteKey: string, resetDate?: { [key: string]: Date } | null): Promise<RemoteDataHash> {
    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');
    const params: ParamCodeValue[] = await remoteDataModel.aggregate([
      ...this._codeValueProjection(remoteKey)
    ]).allowDiskUse(true) as ParamCodeValue[];

    return Promise.resolve(this._getHashCodeValue(params, resetDate));
  }

  public async getRemoteDataLastTimestamp(remoteKey?: string): Promise<remoteDataStatusHash> {
    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');
    const remoteDataStatus: RemoteDataStatus[] = await remoteDataModel.aggregate([
      remoteKey
        ? { $match: { 'remote_key': new mongoose.Types.ObjectId(remoteKey) } }
        : { $match: {} },
      { '$sort': { server_timestamp: -1 } },
      {
        $group: {
          _id: {
            remote_key: '$remote_key',
            hardware_address: '$hardware_address'
          },
          hardware_address: { $first: '$hardware_address' },
          remote_key: { $first: '$remote_key' },
          server_timestamp: { $first: '$server_timestamp' },
        }
      },
      {
        $project: {
          _id: 0,
          remote_key: 1,
          hardware_address: 1,
          server_timestamp: 1,
        }
      }
    ]).allowDiskUse(true) as RemoteDataStatus[];

    // tslint:disable-next-line
    const remoteDataStatusHash: remoteDataStatusHash = remoteDataStatus.reduce((acc: any, next: any) => {
      acc[next.remote_key]
        ? acc[next.remote_key][next.hardware_address] = next.server_timestamp
        : acc[next.remote_key] = { [next.hardware_address]: next.server_timestamp };
      return acc;
    }, {});
    return Promise.resolve(remoteDataStatusHash);
  }

  public async getRemoteKeys(): Promise<string[]> {
    const remoteDataModel: mongoose.Model<mongoose.Document> = mongoose.model('Remote_data');
    const remoteKeysModel: { _id: string }[] = await remoteDataModel.aggregate([
      {
        $group: {
          _id: '$remote_key'
        }
      }
    ]) as { _id: string }[];

    const remoteKeys: string[] = remoteKeysModel.map((item: { _id: string }) => item._id);
    return Promise.resolve(remoteKeys);
  }

  // tslint:disable-next-line
  private _codeValueProjection(remoteKey: string): any[] {
    const today: Date = new Date();
    const yesterday: Date = new Date(today);

    yesterday.setDate(today.getDate() - 7);
    yesterday.setHours(23, 59, 59, 999);

    return [
      { $match: { remote_key: new mongoose.Types.ObjectId(remoteKey) } },
      { $match: { remote_data_timestamp: { $gt: yesterday } } },
      { $sort: { 'remote_data_timestamp': -1 } },
      {
        $group: {
          _id: {
            code: '$code',
            hardware_address: '$hardware_address'
          },
          hardware_address: { $first: '$hardware_address' },
          code: { $first: '$code' },
          value: { $first: '$value' },
          server_timestamp: { $first: '$server_timestamp' },
          remote_data_timestamp: { $first: '$remote_data_timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          code: 1,
          value: 1,
          hardware_address: 1,
          remote_data_timestamp: 1
        }
      }
    ];
  }

  private _getHashCodeValue(
    params: ParamCodeValue[],
    resetDate?: { [key: string]: Date } | null
  ): RemoteDataHash {
    return params
      .reduce((acc: RemoteDataHash, next: ParamCodeValue) => {
        const value: ParamCodeValue['value'] = resetDate && resetDate[next.hardware_address]
          ? resetDate[next.hardware_address] > next.remote_data_timestamp
            ? 0
            : next.value
          : next.value;
        acc[next.hardware_address] = {
          ...acc[next.hardware_address],
          [next.code]: value
        };
        return acc;
      }, {});
  }

}

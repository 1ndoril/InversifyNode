import * as mongoose from 'mongoose';

export class PointsModel {
  public async getPointsWithEquipment(
    /* tslint:disable */
    query: { [key: string]: any } = {},
    projection: { [key: string]: any } = {}
    /* tslint:enable */
  ): Promise<Point[]> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    let points: Point[] = await pointsModel.find(query, projection)
      .lean()
      .exec() as Point[];
    const ids: string[] = points.map((point: Point) => point._id);
    const equipments: Equipment[] = await equipmentsModel.find({ point_id: { $in: ids } })
      .lean()
      .exec() as Equipment[];

    const equipmentsHash: { [key: string]: Equipment[] } =
      equipments.reduce((acc: { [key: string]: Equipment[] }, equipment: Equipment) => {
        const id: string = equipment.point_id;
        acc[id] = Array.isArray(acc[id]) ? [... acc[id], equipment] : [equipment];
        return acc;
      }, {});
    points = points.map((point: Point) => {
      point.equipments = equipmentsHash[point._id] || [];
      return point;
    });
    points.forEach((point: Point) => {
      point.finance = this._equipmentsFinanceSum(point.equipments ? point.equipments : []);
    });
    return points;
  }

  public async isPointExists(remoteKey: string | string[] | undefined): Promise<boolean> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const point: mongoose.Document | null = await pointsModel
      .findOne({ 'remote_key': remoteKey });

    return Promise.resolve(point !== null ? true : false);
  }

  public async addPoint(pointObj: Point): Promise<Point> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const point: mongoose.Document = await pointsModel
      .create(pointObj);

    return Promise.resolve({
      ...point.toObject(),
      equipments: [] as Equipment[]
    } as Point);
  }

  public async updatePoint(pointObj: Point): Promise<Point> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    await pointsModel.findOneAndUpdate({ _id: pointObj._id }, pointObj);
    return Promise.resolve(pointObj);
  }

  public async deletePoint(pointObj: Point): Promise<void> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    return await pointsModel.remove({ _id: pointObj._id });
  }

  // tslint:disable-next-line
  public async getPoint(query: { [key: string]: any }, projection: { [key: string]: any }): Promise<any> {
    // tslint:disable-next-line
    const pointsModel: mongoose.Model<any> = mongoose.model('Points');
    return await pointsModel.findOne(query, projection);
  }

  public async getPointsRemoteKeysHash(): Promise<{ [key: string]: string }> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const pointsRemoteKeys: {_id: string, remote_key: string}[] = await pointsModel.find({}, {remote_key: 1})
      .lean() as {_id: string, remote_key: string}[];

    return pointsRemoteKeys.reduce((acc: { [key: string]: string }, next: { [key: string]: string }) => {
      return {...acc, [next.remote_key] : next._id};
    }, {});
  }

  public async getUsersPointIdsHash(remoteKey?: string): Promise<{ [key: string]: string[] }> {
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const usersRemoteKeys: {[key: string]: string}[] = await pointsModel.aggregate([
      remoteKey
      ? { $match: {'remote_key': new mongoose.Types.ObjectId(remoteKey)}}
      : { $match: {}},
      { $unwind: '$users' },
      {
        $group: {
          _id: '$_id',
          point_id: { $first: '$_id' },
          user:  {$first: '$users'}
        }
      },
      {
        $group: {
          _id: '$user',
          point_ids: {
            $push: '$point_id'
          }
        }
      }
    ]).allowDiskUse(true) as {[key: string]: string}[];
    // tslint:disable-next-line
    return usersRemoteKeys.reduce((acc: any, next: any) => {
      return {...acc, [next._id.toString()] : next.point_ids};
    }, {});
  }

  private _equipmentsFinanceSum(equipments: Equipment[]): Point['finance'] {
    const finance: Point['finance'] = {
      encashment: 0,
      total: 0,
      spent: 0,
      bonuses: 0,
      current_day: 0
    };
    equipments.forEach((equipment: Equipment) => {
      if (!equipment.finance) {
        return;
      }
      finance.total += equipment.finance.total;
      finance.bonuses += equipment.finance.bonuses;
      finance.spent += equipment.finance.spent;
      finance.encashment += equipment.finance.encashment;
      finance.current_day += equipment.finance.current_day ? equipment.finance.current_day : 0;
    });
    return finance;
  }

}

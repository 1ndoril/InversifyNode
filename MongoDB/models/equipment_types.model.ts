import * as mongoose from 'mongoose';
export class EquipmentTypesModel {
  public async getEquipmentTypes(
    /* tslint:disable */
    query: { [key: string]: any } = {},
    projection: { [key: string]: any } = {}
    /* tslint:enable */
  ): Promise<EquipmentType[]> {
    const currenciesModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipment_types');
    return await currenciesModel.find(query, projection).lean() as EquipmentType[];
  }
  public async getEquipmentMultipliers(): Promise<{ [key: string]: number }> {
    const currenciesModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipment_types');
    // tslint:disable-next-line
    const values: Currency[] = await currenciesModel.aggregate({ $unwind: '$fields' }, {
      $group: {
        _id: '$fields._id', multiplier: { $first: '$fields.multiplier' }
      }
    }) as Currency[];
    return values
      .reduce(
        (hashFieldIdMulter: { [key: string]: number }, fieldIdMulterObj: { _id: string, multiplier: number }) => {
          hashFieldIdMulter[fieldIdMulterObj._id] = fieldIdMulterObj.multiplier;
          return hashFieldIdMulter;
        }, {}
      );
  }
}


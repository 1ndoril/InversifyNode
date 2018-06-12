import * as mongoose from 'mongoose';

export class UnitsModel {
  public async getUnits(
    /* tslint:disable */
    query: { [key: string]: any } = {},
    projection: { [key: string]: any } = {}
    /* tslint:enable */
  ): Promise<Unit[]> {
    const unitsModel: mongoose.Model<mongoose.Document> = mongoose.model('Units');
    return await unitsModel.find(query, projection).lean() as Unit[];
  }
}

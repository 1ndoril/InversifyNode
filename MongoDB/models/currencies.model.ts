import * as mongoose from 'mongoose';

export class CurrenciesModel {
  public async getCurrencies(
    /* tslint:disable */
    query: { [key: string]: any } = {},
    projection: { [key: string]: any } = {}
    /* tslint:enable */
  ): Promise<Currency[]> {
    const currenciesModel: mongoose.Model<mongoose.Document> = mongoose.model('Currencies');
    return await currenciesModel.find(query, projection).lean() as Currency[];
  }

  public async getCurrencyMultiplier(
    /* tslint:disable */
    query: { [key: string]: any } = {},
    projection: { [key: string]: any } = {}
    /* tslint:enable */
  ): Promise<number> {
    const currenciesModel: mongoose.Model<mongoose.Document> = mongoose.model('Currencies');
    const currency: Currency = await currenciesModel.findOne(query, projection).lean() as Currency;
    return Promise.resolve(currency ? currency.multiplier : 1);
  }
}

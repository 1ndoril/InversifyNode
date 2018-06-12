import { RemoteDataModel } from './../models/remote_data.model';
import { PointsModel } from '../models/points.model';
import { EquipmentsModel } from '../models/equipments.model';
import { CurrenciesModel } from '../models/currencies.model';
import * as config from 'config';
import { find, result } from 'lodash';

export class FinanceService {
  public async recalculateFinanceData(remoteKey: string): Promise<void> {
    const { encashmentCode, totalCode, spentCode, bonusCode } = config.get('finance');
    const point: { _id: Object, currency: String } = await new PointsModel().getPoint({
      remote_key: remoteKey },
      { _id: 1, currency: '1' }
    );
    const multiplier: number = await new CurrenciesModel().getCurrencyMultiplier({ _id: point.currency });

    const remoteDataFinances: RemoteDataFinance[] =
    await new RemoteDataModel().getRemoteDataFinances(remoteKey, encashmentCode, totalCode, spentCode, bonusCode);
    const currentDayHash: RemoteDataCurrentDayHash = await new RemoteDataModel().getCurrentDayFinances(remoteKey);

    remoteDataFinances.forEach(async (item: RemoteDataFinance) => {
      const hardwareAddress: string = item.hardware_address;

      const lastFinanceData: Finance = await new EquipmentsModel().findEquipmentFinance({
        point_id: point._id,
        hardware_address: hardwareAddress
      });

      const encashmentValue: string = result(find(item.finance, { code: encashmentCode}), 'value');
      const totalValue: string = result(find(item.finance, { code: totalCode}), 'value');
      const spentValue: string = result(find(item.finance, { code: spentCode}), 'value');
      const bonusesValue: string = result(find(item.finance, { code: bonusCode}), 'value');

      const encashment: number = this._calculateFinanceValue(encashmentValue, multiplier, lastFinanceData.encashment);
      const total: number = this._calculateFinanceValue(totalValue, multiplier, lastFinanceData.total);
      const spent: number = this._calculateFinanceValue(spentValue, multiplier, lastFinanceData.spent);
      const bonuses: number = this._calculateFinanceValue(bonusesValue, multiplier, lastFinanceData.bonuses);
      const currentDay: number = multiplier * this._culculateCurrentDayFinance(currentDayHash[hardwareAddress]);

      const financeData: Finance = {
        encashment,
        total,
        spent,
        bonuses,
        current_day: currentDay
      };

      await new EquipmentsModel().updateFinances({
        point_id: point._id,
        hardware_address: hardwareAddress
      }, financeData);
    });

  }

  private _culculateCurrentDayFinance(currentDayHash: string[]): number {
    if (!Array.isArray(currentDayHash)) {
      return 0;
    }
    return currentDayHash
      .reduce((acc: number, next: string, index: number) => {
        const current: number = Number(next);
        const previous: number = Number(currentDayHash[index - 1]);
        const value: number = current - previous;
        if (isNaN(value) || value < 0) {
          return acc;
        }
        return acc += value;
      }, 0);
  }

  private _calculateFinanceValue(
    currentFinancevalue: string | number,
    multiplier: number,
    lastFinanceDataValue: number
  ): number {
    const numericValue: number = Number(currentFinancevalue);
    return Number.isNaN(numericValue)
      ? lastFinanceDataValue || 0
      : multiplier * numericValue;
  }
}

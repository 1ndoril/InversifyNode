import * as mongoose from 'mongoose';
import { EquipmentTypesModel } from '../models/equipment_types.model';

export class EquipmentsModel {
  // tslint:disable-next-line
  public async findEquipment(query: any): Promise<Equipment> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const equipment: Equipment = await equipmentsModel.findOne(query).lean() as Equipment;
    return Promise.resolve(equipment);
  }

  // tslint:disable-next-line
  public async findEquipmentFinance(query: any): Promise<Finance> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const equipment: Equipment = await equipmentsModel.findOne(query, { finance: 1 }).lean() as Equipment;
    return Promise.resolve(equipment.finance || {});
  }

  // tslint:disable-next-line
  public async updateFinances(query: any, finance: Finance): Promise<void> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    return await equipmentsModel.update(query, { $set: { finance } });
  }

  public async resetPostData(_id: string): Promise<{ point: Point, equipment: Equipment }> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const pointsModel: mongoose.Model<mongoose.Document> = mongoose.model('Points');
    const equipment: Equipment = await equipmentsModel.findOne({ _id }).lean().exec() as Equipment;
    const point: Point = await pointsModel.findOne({ _id: equipment.point_id }).lean().exec() as Point;
    // TODO -> TRY TO USE REDUCER
    Object.keys(equipment.finance).forEach((key: string) => {
      if (isNaN(point.finance[key])) {
        return;
      }
      point.finance[key] -= equipment.finance[key];
      equipment.finance[key] = 0;
    });
    equipment.monitoring_params.forEach((params: MonitoringParam) =>
      Object.keys(params.state).forEach((key: string) => params.state[key] = 0));

    if (!equipment.reset_date) {
      equipment.reset_date = [];
    }

    const newDate: Date = new Date();
    equipment.reset_date.push(newDate);

    await pointsModel.update({ _id: point._id }, {
      finance: point.finance
    });

    await equipmentsModel.update({ _id },
      {
        monitoring_params: equipment.monitoring_params,
        // TODO update finance model
        finance: equipment.finance,
        $set: { reset_date: equipment.reset_date }
      });
    return { point, equipment };
  }

  public async addEquipment(
    equipmentsObj: { point_id: string, name: string, hardware_address: number, showFinance: boolean }
  ): Promise<{ point_id: string, name: string, hardware_address: number }> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const { point_id, name, hardware_address, showFinance } = equipmentsObj;
    const finance: Equipment['finance'] = {
      encashment: 0,
      total: 0,
      spent: 0,
      bonuses: 0,
      current_day: 0
    };
    const point: mongoose.Document = await equipmentsModel
      .create({
        point_id,
        name,
        hardware_address,
        showFinance,
        finance
      });
    return Promise.resolve(point.toObject() as Equipment);
  }

  public async updateEquipment(
    equipmentsObj: { _id: string, name: string, hardware_address: string, showFinance: boolean }
  ): Promise<{ _id: string, name: string, hardware_address: string }> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const { _id, name, hardware_address, showFinance } = equipmentsObj;
    await equipmentsModel
      .findOneAndUpdate({ _id }, {
        name,
        hardware_address,
        showFinance
      });
    return Promise.resolve(equipmentsObj);
  }

  // tslint:disable-next-line
  public async updateEquipmentStatus(
    query: { point_id: string, hardware_address: string },
    fieldsToUpdate: { status: boolean, lastActivity: Date }
  ): Promise<Equipment> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const equipment: Equipment = await equipmentsModel.findOneAndUpdate(query, fieldsToUpdate, { new: true })
      .lean() as Equipment;
    return Promise.resolve(equipment);
  }

  public async deleteEquipments(_id: string): Promise<void> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    return await equipmentsModel.remove({ _id });
  }

  public async addParam(
    paramObj: { _id: string, param: MonitoringParam }
  ): Promise<MonitoringParam> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const { _id, param } = paramObj;
    param._id = mongoose.Types.ObjectId();

    const state: { [key: string]: string | number } = this._monitoringParamState(param);

    const newParam: MonitoringParam = {
      ...param,
      state
    };
    await equipmentsModel
      .update({ _id }, {
        $push: { monitoring_params: newParam }
      });
    return Promise.resolve(newParam);
  }

  public async updateParam(
    paramObj: { _id: string, param: MonitoringParam }
  ): Promise<MonitoringParam> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const { _id, param } = paramObj;
    const updatedParam: MonitoringParam = { ...param };
    await equipmentsModel
      .update({
        _id,
        'monitoring_params._id': param._id
      }, {
        $set: { 'monitoring_params.$': updatedParam }
      });
    return Promise.resolve(updatedParam);
  }

  public async deleteParam(
    paramObj: { _id: string, paramId: string }
  ): Promise<boolean> {
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const { _id, paramId } = paramObj;
    await equipmentsModel
      .update({ _id }, {
        $pull: { monitoring_params: { _id: paramId } }
      });
    return Promise.resolve(true);
  }

  public async updateMonitoringParamsStates(
    // tslint:disable-next-line
    query: { [key: string]: any },
    // tslint:disable-next-line
    paramsHash: { [key: string]: any }
    // tslint:disable-next-line
  ): Promise<any> {
    // tslint:disable-next-line
    const multipliers: { [key: string]: number } = await new EquipmentTypesModel().getEquipmentMultipliers();
    const equipmentsModel: mongoose.Model<mongoose.Document> = mongoose.model('Equipments');
    const equipments: mongoose.Document[] = await equipmentsModel.find(query);
    if (!equipments.length) {
      throw new Error('Equipment not found');
    }
    for (let i: number = 0; i < equipments.length; i++) {
      const equipmentObj: Equipment = (equipments[i].toObject() as Equipment);
      const monitoringParams: MonitoringParam[] = equipmentObj
        .monitoring_params.map((param: MonitoringParam) => {
          const monitoredParam: MonitoringParamInfo | undefined = param.info
            .find((info: MonitoringParamInfo) => info.isMonitored);
          const paramAddress: { [key: string]: number } = paramsHash[equipmentObj.hardware_address];
          if (
            monitoredParam
            && paramAddress
            && paramAddress[monitoredParam.code]
          ) {
            const multiplier: number =
              isNaN(multipliers[monitoredParam.fields_id]) ? 1 : multipliers[monitoredParam.fields_id];
            param.state[monitoredParam.fields_id] = paramAddress[monitoredParam.code] * multiplier;
          }
          return param;
        });
      await equipmentsModel.update({ _id: equipmentObj._id }, { $set: { monitoring_params: monitoringParams } });
    }
  }

  // tslint:disable-next-line
  private _monitoringParamState(param: any): {
    [key: string]: number
  } {
    // tslint:disable-next-line
    return param.info.reduce((stateObj: { [key: string]: string | number }, info: any) => {
      if (info.isMonitored) {
        stateObj[info.fields_id] = 0;
      }
      return stateObj;
    }, {});
  }
}

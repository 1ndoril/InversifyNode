import { FinanceService } from './finance.service';
import { SocketService } from './socket.service';
import { RemoteDataModel } from './../models/remote_data.model';
import { PointsModel } from '../models/points.model';
import { EquipmentsModel } from '../models/equipments.model';
import { UPDATE_POINT_SUCCESS } from '../../../socket';

export class RemoteDataService {
  /**
   * Update equipments.monitoring_params and send updated point by socket to client
   * @param remoteKey
   */
  public async calculateRemoteData(remoteKey?: string): Promise<void> {
    if (remoteKey) {
      return await this._calculateRemoteData(remoteKey);
    }
    const remoteKeys: string[] = await new RemoteDataModel().getRemoteKeys();
    await Promise.all(remoteKeys.map(async (remoteKeyValue: string) => {
      await this._calculateRemoteData(remoteKeyValue);
    }));
  }

  public async _calculateRemoteData(remoteKey: string): Promise<void> {
    const equipmentsModel: EquipmentsModel = new EquipmentsModel();
    const pointsModel: PointsModel = new PointsModel();

    const point: { _id: Object, currency: String } = await pointsModel.getPoint(
      { remote_key: remoteKey },
      {
        _id: 1,
        currency: '1'
      }
    );

    const paramCodeValue: RemoteDataHash = await new RemoteDataModel().getParamCodeValue(remoteKey);

    await equipmentsModel.updateMonitoringParamsStates({ point_id: point._id }, paramCodeValue);
    await new FinanceService().recalculateFinanceData(remoteKey);

    const points: Point[] = await pointsModel.getPointsWithEquipment({ remote_key: remoteKey });
    if (!Array.isArray(points[0] && points[0].users) ) {
      return;
    }
    const socketService: SocketService = new SocketService();
    points[0].users.forEach(async (userLogin: string) => {
      const pointWithEquipment: Point = {...points[0]};
      delete pointWithEquipment.users;
      await socketService.emit({userLogin, type: UPDATE_POINT_SUCCESS, payload: pointWithEquipment});
    });
  }

}

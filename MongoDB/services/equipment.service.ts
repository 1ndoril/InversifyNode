import { SocketService } from './socket.service';
import { UPDATE_EQUIPMENTS_STATUS_SUCCESS } from '../../../socket/index';
import * as config from 'config';
import { EquipmentsModel } from './../models/equipments.model';
import { RemoteDataModel } from './../models/remote_data.model';
import { PointsModel } from './../models/points.model';
export class EquipmentsService {

  public async findInactiveEquipments(optionalRemoteKey?: string): Promise<EquipmentsStatusData> {
    const activeEquipmentInterval: number = config.get('activeEquipmentInterval');
    const date: Date = new Date();
    const activeEquipmentDate: Date = new Date(date.getTime() - activeEquipmentInterval);

    const remoteDataStatusHash: remoteDataStatusHash =
    await new RemoteDataModel().getRemoteDataLastTimestamp(optionalRemoteKey);
    const pointsRemoteKeysHash: { [key: string]: string } = await new PointsModel().getPointsRemoteKeysHash();

    // object map with unique id: {point_id and hardware_address} and last remoteData timestamp value
    const pointsStatus: Map<{point_id: string, hardware_address: string}, Date> = new Map();
    Object.keys(remoteDataStatusHash).forEach((remoteKey: string) => {
      Object.keys(remoteDataStatusHash[remoteKey]).forEach((hardwareAddress: string) => {
        pointsStatus.set({
            point_id: pointsRemoteKeysHash[remoteKey],
            hardware_address: hardwareAddress
          }, remoteDataStatusHash[remoteKey][hardwareAddress]);
      });
    });

    // point iterate and update their equipments with status(compare remoteDate timestamp with offset date )
    // const gmtService: GmtService = new GmtService();
    const equipmentsForUpdate: EqyipmentsForUpdate = {};
    for (const [query, lastActivity] of pointsStatus) {
      const status: boolean = lastActivity > activeEquipmentDate ? true : false;
      const equipment: Equipment = await new EquipmentsModel().updateEquipmentStatus({
        point_id: query.point_id,
        hardware_address: query.hardware_address
      }, {status, lastActivity});
      if (equipment) {
        equipmentsForUpdate[query.point_id]
        ? equipmentsForUpdate[query.point_id].equipments.push(equipment)
        : equipmentsForUpdate[query.point_id] = {equipments: [equipment]};
      }
    }

    const usersPointIdsHash: UsersPointIdsHash = await new PointsModel().getUsersPointIdsHash(optionalRemoteKey);
    await new SocketService().emit({
      type: UPDATE_EQUIPMENTS_STATUS_SUCCESS,
      payload: {usersPointIdsHash, equipmentsForUpdate}
    });

    return Promise.resolve({usersPointIdsHash, equipmentsForUpdate});
  }

  public async sendEquipmentsStatus(
    io: SocketIO.Server,
    action: {type: string, payload: EquipmentsStatusData}
  ): Promise<void> {
    Object.keys(io.sockets.adapter.rooms)
      .forEach((user: string) => {
        if (!action.payload.usersPointIdsHash[user]) {
          return;
        }
        action.payload.usersPointIdsHash[user].forEach(async (pointId: string) => {
          io.in(user).emit('update', {
            type: action.type,
            payload: action.payload.equipmentsForUpdate[pointId].equipments
          });
        });
      });
  }
}

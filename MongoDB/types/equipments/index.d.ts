type Equipment = {
  _id: string,
  name: string,
  equipment_id?: string,
  timestamp?: Date,
  total: number,
  finance: {
    total: number,
    encashment: number,
    spent: number,
    bonuses: number,
    current_day: number,
    [key: string]: number
  },
  showFinance: boolean,
  monitoring_params: MonitoringParam[],
  point_id: string,
  remote_key: string,
  position: number,
  hardware_address: number,
  reset_date: Date[],
  status?: boolean,
  lastActivity?: Date
};

type MonitoringParam = {
  _id: Object,
  type: string,
  name: string,
  currency: string,
  info: MonitoringParamInfo[],
  status: {
    text: string,
    color: string,
    level: number,
    value: number
  },
  position: number,
  state: { [key: string]: string | number }
};
type MonitoringParamInfo = {
  fields_id: string,
  value: number,
  code: number
  isMonitored: boolean
};


type EqyipmentsForUpdate = {[key: string]: {equipments: Equipment[]}}
type UsersPointIdsHash = { [key: string]: string[] }
type EquipmentsStatusData = {
  usersPointIdsHash: UsersPointIdsHash,
  equipmentsForUpdate: EqyipmentsForUpdate
}

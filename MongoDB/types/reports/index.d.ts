type Report = {
  totalFinanceForPeriod: number,
  totalsUedTimeForPeriod: number,
  totalEffectiveness: number,
  points: ReportPoint[]
}

type ReportTable = {
  header: { [key: string]: string }[],
  totalDataHeader: (string | number)[],
  totalFinanceForPeriod: number,
  totalsUedTimeForPeriod: number,
  totalEffectiveness: number,
  points: ReportPoint[]
}

type ReportChartData = {
  pointId: string,
  title: string,
  labels: string[],
  customTooltips: {
    headers: { [key: string]: string },
    data: any[]
  },
  datasets: {
    label: string,
    stack: string,
    data: number[],
  }[]
}

type ReportPoint = {
  _id?: string,
  financeForPeriod: number,
  usedTime: number,
  effectiveness: number,
  equipments: ReportEquipment[]
}

type ReportEquipment = {
  hardware_address: number,
  financeForPeriodValue: number,
  usedTimeForPeriodValue: number,
  effectiveness: number,
}

type ReportParams = {
  dateFrom: Date,
  dateTo: Date,
  pointIds: string[],
  login: string,
  type: string
}

type ReportFinanceData = {
  hardware_address: string,
  remote_key: string,
  values: string[]
};

type AvarageReport = {
  headers: number[],
  totalData: number[],
  points: AvarageReportPoint[]
}

type AvarageReportFinanceData = {
  _id: {
    hardware_address: string,
    remote_key: string,
    dateInterval: number
  },
  values: string[]
}

type ReportFinanceHash = HashMap<HashMap<HashMap<number>>>

type AvarageReportPoint = {
  _id?: string,
  data: number[],
  equipments: AvarageReportEquipment[]
}

type AvarageReportEquipment = {
  _id?: string,
  hardware_address: string,
  data: number[],
}

type SplitedDate = { dateFrom: Date, dateTo: Date }

type PopularReport = {
  totalData: { [key: string]: number },
  points: PopularReportPoint[]
}

type PopularReportPoint = {
  equipments: PopularReportEquipment[],
  data: { [key: string]: number }
}

type PopularReportEquipment = {
  _id: string,
  name: string,
  point_id: string,
  hardware_address: number,
  data: { [key: string]: number }
}

type PopularReportFinanceData = {
  hardware_address: string,
  remote_key: string,
  code: string,
  values: string[]
};

type Period = {
  periodAmount: number,
  addPeriod?: 'weeks' | 'days' | 'months',
  subtractPeriod?: 'weeks' | 'days' | 'months'
};

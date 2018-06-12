type RemoteData = {
  _id: Object
  remote_key: string,
  params: RemoteParam[],
  timestamp: Date
};

type Remote_Data = {
  _id: Object,
  remote_key: Object,
  code: string,
  value: string,
  hardware_address: number,
  server_timestamp: Date,
  remote_data_timestamp: Date
};

type RemoteParam = {
  code: string,
  value: string,
  hardware_address: number,
  timestamp: Date,
  remote_key?: string,
  remote_data_timestamp?: Date
};

type ParamCodeValue = {
  code: string,
  value: string | number,
  hardware_address: number,
  server_timestamp: Date,
  remote_data_timestamp: Date
};

// { hardware_address: { code: value } }
type RemoteDataHash = {
  [key: string]: {
    [key: string]: string | number
  }
};

type RemoteDataStatus = {
  remote_key: string,
  hardware_address: string,
  timestamp: Date,
}

// { remote_key: { hardware_address: Date (lastActivity) } }
type remoteDataStatusHash = {
  [key: string]: {
    [key: string]: Date
  }
}

type RemoteDataFinance = {
  hardware_address: string,
  finance: CodeValueHash[]
}

type CodeValueHash = {
  code: string,
  value: string
}

// { hardware_address: remoteData_current_day_finance[] }
type RemoteDataCurrentDayHash = {
  [key: string]: string[]
}


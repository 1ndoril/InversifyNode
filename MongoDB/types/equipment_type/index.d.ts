type EquipmentType = {
  _id?: string,
  type: string,
  desc: string,
  fields: EquipmentField[]
};

type EquipmentField = {
  _id: string,
  value: { [key: string]: string },
  position: number,
  unit: string,
  multiplier: number, 
  validation: {
    required: boolean,
    regular_exp: string,
    i18n: { [key: string]: string }
  }
};

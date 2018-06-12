import * as mongoose from 'mongoose';

export const toObjectIds: (ids: string []) => mongoose.Types.ObjectId[] = (ids: string []) => {
  return ids.map((id: string) => new mongoose.Types.ObjectId(id));
};

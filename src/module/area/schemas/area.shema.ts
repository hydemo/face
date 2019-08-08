import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const AreaSchema = new mongoose.Schema(
  {
    // 片区名称
    name: String,
    // 省份
    proviance: String,
    // 城市
    city: String,
  },
  { collection: 'area', versionKey: false, timestamps: true },
);

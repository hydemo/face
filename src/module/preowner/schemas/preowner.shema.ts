import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const PreownerSchema = new mongoose.Schema(
  {
    // 姓名
    username: String,
    // 安装区域
    cardNumber: String,
    // 单元房名称
    building: String,
    // 房间号
    houseNumber: String,
    // 小区
    zone: String,
  },
  { collection: 'preowner', versionKey: false, timestamps: true },
);

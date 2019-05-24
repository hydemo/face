import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const TaskSchema = new mongoose.Schema(
  {
    // 安装人员
    installer: ObjectId,
    // 安装区域
    position: ObjectId,
    // 安装截止日期
    expireTime: Date,
    // 是否完成
    isDone: { type: Boolean, default: false },
    // 晚上时间
    installTime: Date,
    // 安装小区
    zone: ObjectId,
    // 安装具体位置描述
    description: String,
    // 设备信息
    device: ObjectId,
  },
  { collection: 'task', versionKey: false, timestamps: true },
);

import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const DeviceSchema = new mongoose.Schema(
  {
    // 设备用户名
    username: String,
    // 设备密码
    password: String,
    // 设备uuid
    deviceUUID: { type: String, unique: true },
    // 设备类型 1 枪机 2 门禁机
    deviceType: { type: Number, enum: [1, 2] },
    // 通过类型 1 进入 2 离开
    passType: { type: Number, enum: [1, 2] },
    // 算法版本
    algorithmVersion: String,
    // 模型版本
    modelVersion: String,
    // 软件内核版本
    softwardVersion: String,
    // 是否启用
    enable: { type: Boolean, default: true },
    // sim卡ID
    simId: ObjectId,
    // 安装位置
    position: ObjectId,
    // 安装区域
    zone: ObjectId,
    // 安装地点描述
    description: String,
    // 是否绑定
    isBind: { type: Boolean, default: false },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 广告机
    media: ObjectId,
    // 版本
    version: { type: String, default: '1.1.0' },
    // session
    session: String,
    // 设备id
    deviceId: { type: Number, unique: true },
    // 是否推送到智能感知平台
    isZOCPush: { type: Boolean, default: false },
    // 智能感知平台包名
    ZOCZip: String,
    // 智能感知平台上传时间
    upTime: Date,
    // 片区
    area: ObjectId,
  },
  { collection: 'device', versionKey: false, timestamps: true },
);

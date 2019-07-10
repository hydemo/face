import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const OrbitSchema = new mongoose.Schema(
  {
    // 用户
    user: ObjectId,
    // 设备
    device: ObjectId,
    // 区域
    zone: ObjectId,
    // 名单类型
    mode: { type: Number, enum: [1, 2, 3] },
    // 通过时间
    passTime: { type: Date, default: Date.now() },
    // 比对结果
    compareResult: { type: Number },
    // 抓拍图片url
    imgUrl: { type: String },
    // 人脸背景图片数据
    imgexUrl: { type: String },
    // 访问次数
    visitCount: { type: Number },
    // 人脸质量
    faceQuality: { type: Number },
    // 人脸特征值
    faceFeature: { type: String },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 是否推送到智能感知平台
    isZOCPush: { type: Boolean, defaut: false },
    // 智能感知平台包名
    ZOCZip: String,
    // 人脸属性
    attribute: {
      // 年龄
      age: Number,
      // 性别 1:男 2:女
      gender: Number,
      // 是否佩戴眼镜 0:否 1:戴眼镜 2:戴太阳镜
      glasses: Number,
      // 是否戴面具 0:否 1:是
      mask: Number,
      // 是否留胡子 0:否 1:是 
      beard: Number,
      // 人种 1:黄种人 2:黑种人 3:白种人
      race: Number,
      // 情绪 1:生气 2:平静 3:高兴 4:悲伤 5:惊讶
      emotion: Number,
    }
  },
  { collection: 'orbit', versionKey: false, timestamps: true },
);

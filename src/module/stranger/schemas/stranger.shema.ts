import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const StrangerSchema = new mongoose.Schema(
  {
    // 设备
    device: ObjectId,
    // 区域
    zone: ObjectId,
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
  { collection: 'stranger', versionKey: false, timestamps: true },
);

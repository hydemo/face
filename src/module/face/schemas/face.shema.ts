import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const FaceSchema = new mongoose.Schema(
  {
    // 设备
    device: ObjectId,
    // 用户
    user: ObjectId,
    // 类型
    mode: { type: Number, enum: [1, 2, 3] },
    // 库索引
    libIndex: Number,
    // 图片索引
    flieIndex: Number,
    // 图片名
    pic: String,
    // 过期时间
    expire: Date,
    // 绑定id
    bondToObjectId: ObjectId,
    // 绑定类型
    bondType: String,
    // 区域
    zone: ObjectId,
    // 上传结果 1:同步中，2：通过，3:失败
    checkResult: { type: Number, default: 1, enum: [1, 2, 3] },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 人脸链接
    // faceUrl: String,
  },
  { collection: 'face', versionKey: false, timestamps: true },
);

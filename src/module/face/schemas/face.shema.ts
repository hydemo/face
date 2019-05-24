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
  },
  { collection: 'face', versionKey: false, timestamps: true },
);

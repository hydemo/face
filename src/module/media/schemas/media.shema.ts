import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const MediaSchema = new mongoose.Schema(
  {
    // 登录名
    username: String,
    // 密码
    password: String,
    // 区域
    zone: ObjectId,
    // 区域名
    zoneName: String,
    // token
    token: String,
  },
  { collection: 'media', versionKey: false, timestamps: true },
);

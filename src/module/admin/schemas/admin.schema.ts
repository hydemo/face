import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const AdminSchema = new mongoose.Schema(
  {
    // 昵称
    nickname: { type: String },
    // 密码
    password: String,
    // 注册时间
    addTime: Date,
    // 手机
    phone: { type: String, unique: true },
    // 头像
    avatar: String,
    // 昵称
    role: { type: Number },
    // 最后登录时间
    lastLoginTime: Date,
    // 最后登录ip
    lastLoginIp: String,
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 删除时间
    deleteTime: Date
  },
  { collection: 'admin', versionKey: false, timestamps: true },
);

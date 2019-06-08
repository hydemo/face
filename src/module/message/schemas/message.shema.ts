import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const MessageSchema = new mongoose.Schema(
  {
    // 发送人
    sender: String,
    // 消息类型
    type: String,
    // 接收人
    receiver: ObjectId,
    // 轨迹
    orbit: ObjectId,
    // 小区
    zone: String,
    // 抓拍头像
    imgUrl: String,
    // 抓拍原图
    imgexUrl: String,
    // 比对结果
    compareResult: { type: Number },
    // 位置
    position: String,
    // 通过类型 1 进入 2 离开
    passType: { type: Number, enum: [1, 2] },
    // 标题
    title: String,
    // 内容
    content: [{
      // 类型
      contentType: String,
      // 内容
      content: String
    }],
    // 是否阅读
    isRead: { type: Boolean, default: false },
    // 是否删除
    isDelete: { type: Boolean, default: false },
  },
  { collection: 'message', versionKey: false, timestamps: true },
);

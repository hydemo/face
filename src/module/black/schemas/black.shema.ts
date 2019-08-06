import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const BlackSchema = new mongoose.Schema(
  {
    // 审核情况 1:待审核 2:通过 3:拒绝
    checkResult: { type: Number, enum: [1, 2, 3] },
    // 申请人
    applicant: ObjectId,
    // 申请时间
    applicationTime: Date,
    // 审核时间
    checkTime: Date,
    // 审核人
    reviewer: ObjectId,
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 申请小区
    zone: ObjectId,
    // 类型 1:高危 2:一般
    type: { type: Number, enum: [1, 2] },
    // 姓名
    username: String,
    // 身份证
    cardNumber: String,
    // 申请理由
    reason: String,
    // 人脸图片
    faceUrl: String,
    // 片区
    area: ObjectId,
  },
  { collection: 'black', versionKey: false, timestamps: true },
);

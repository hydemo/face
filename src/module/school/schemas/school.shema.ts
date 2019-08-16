import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const SchoolSchema = new mongoose.Schema(
  {
    // 房间
    address: ObjectId,
    // 区域
    zone: ObjectId,
    // 用户
    user: ObjectId,
    // 审核情况 1:待审核 2:通过 3:拒绝
    checkResult: { type: Number, enum: [1, 2, 3] },
    // 住客类型 1:业主 2 租客 3 常住人
    type: { type: String, enum: ['owner', 'student', 'visitor'] },
    // 添加时间
    addTime: Date,
    // 申请时间
    applicationTime: Date,
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 审核时间
    checkTime: Date,
    // 审核人
    reviewer: ObjectId,
    // 班主任
    owner: ObjectId,
    // 有效期
    expireTime: Date,
    // 家长
    parent: [{ parentType: String, user: String }],
    // 访问理由
    visitorReason: String
  },
  { collection: 'school', versionKey: false, timestamps: true },
);

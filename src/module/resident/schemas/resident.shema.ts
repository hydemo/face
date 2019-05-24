import * as mongoose from 'mongoose';
import { number } from 'joi';

const ObjectId = mongoose.Types.ObjectId;

export const ResidentSchema = new mongoose.Schema(
  {
    // 区域
    zone: ObjectId,
    // 用户
    user: String,
    // 审核情况 1:待审核 2:通过 3:拒绝
    checkResult: { type: Number, enum: [1, 2, 3] },
    // 住客类型 1:业主 2 租客 3 常住人
    type: { type: String, enum: ['owner', 'tenant', 'family'] },
    // 添加时间
    addTime: Date,
    // 申请时间
    applicationTime: Date,
    // 是否监控
    isMonitor: { type: Boolean, default: false },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 审核时间
    checkTime: Date,
  },
  { collection: 'resident', versionKey: false, timestamps: true },
);

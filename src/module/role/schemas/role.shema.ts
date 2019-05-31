import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const RoleSchema = new mongoose.Schema(
  {
    // 用户
    user: ObjectId,
    // 区域
    zone: ObjectId,
    // 角色 1:管理 2:工作人员 3:保安 4:业主 5:租客
    role: { type: Number, enum: [1, 2, 3, 4, 5] },
    // 轨迹
    description: String,
    // 是否删除
    isDelete: { type: Boolean, default: false },
  },
  { collection: 'role', versionKey: false, timestamps: true },
);

import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const RentSchema = new mongoose.Schema(
  {
    // 业主
    owner: ObjectId,
    // 出租时间
    rentTime: Date,
    // 租客
    tenant: ObjectId,
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 申请小区
    zone: ObjectId,
    // 类型 1:监控 2:报警
    address: ObjectId,
    // 是否回收
    isRecyle: { type: Boolean, default: false },
    // 回收时间
    recyleTime: Date,
  },
  { collection: 'rent', versionKey: false, timestamps: true },
);

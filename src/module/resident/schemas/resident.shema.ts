import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const ResidentSchema = new mongoose.Schema(
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
    type: { type: String, enum: ['owner', 'family', 'visitor'] },
    // 添加时间
    addTime: Date,
    // 申请时间
    applicationTime: Date,
    // 是否监控
    isMonitor: { type: Boolean, default: false },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 是否删除
    isDisable: { type: Boolean, default: false },
    // 审核时间
    checkTime: Date,
    // 审核人
    reviewer: ObjectId,
    // 有效期
    expireTime: Date,
    // 是否出租
    isRent: Boolean,
    // 是否推送
    isPush: { type: Boolean, default: false },
    // 是否推送社会化信息采集平台
    isSOCPush: { type: Boolean, defaut: false },
    // 社会化信息采集平台订单号
    SOCOrder: String,
    // 是否推送到智能感知平台
    isZOCPush: { type: Boolean, defaut: false },
    // 智能感知平台包名
    ZOCZip: String,
  },
  { collection: 'resident', versionKey: false, timestamps: true },
);

import * as mongoose from 'mongoose';

export const LogRecordSchema = new mongoose.Schema(
  {
    // 日期
    date: String,
    // 用户增长量
    userCount: { type: Number, default: 0 },
    // 总用户数
    userTotal: Number,
    // 日活
    ipCount: { type: Number, default: 0 },
    // 总访问量
    totalCount: { type: Number, default: 0 },
    // 一标三实
    socCount: { type: Number, default: 0 },
    // 一标三实总量
    socTotal: Number,
    // 住户上传数
    residentCount: { type: Number, default: 0 },
    // 住户信息上报总量
    residentTotal: Number,
    // 刷卡记录上传数
    enRecordCount: { type: Number, default: 0 },
    // 刷卡记录上传总量
    enRecordTotal: Number,
    // 设备上传数
    deviceCount: { type: Number, default: 0 },
    // 设备上传总量
    deviceTotal: Number,
    // 实名认证数
    verifyCount: { type: Number, default: 0 },
    // 实名认证总量
    verifyTotal: Number,
    // 黑名单数
    blackCount: { type: Number, default: 0 },
    // 黑名单总量
    blackTotal: Number,
    // 开门数
    openCount: { type: Number, default: 0 },
    // 开门总量
    openTotal: Number,
    // 户主数
    ownerCount: { type: Number, default: 0 },
    // 户主总量
    ownerTotal: Number,
  },
  { collection: 'logRecord', versionKey: false, timestamps: true },
);

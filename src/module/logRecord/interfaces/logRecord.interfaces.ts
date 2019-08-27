import { Document } from 'mongoose';

export interface ILogRecord extends Document {
  // 日期
  date: string;
  // 用户增长量
  userCount: number;
  // 总用户数
  userTotal: number;
  // 独立ip数
  ipCount: number;
  // 总访问量
  totalCount: number;
  // 一标三实
  socCount: number,
  // 一标三实总量
  socTotal: number,
  // 住户上传数
  residentCount: number;
  // 住户信息上报总量
  residentTotal: number;
  // 刷卡记录上传数
  enRecordCount: number;
  // 刷卡记录上传总量
  enRecordTotal: number;
  // 设备上传数
  deviceCount: number;
  // 设备上传总量
  deviceTotal: number;
  // 实名认证数
  verifyCount: number;
  // 实名认证总量
  verifyTotal: number;
  // 黑名单数
  blackCount: number;
  // 黑名单总量
  blackTotal: number;
  // 开门数
  openCount: number;
  // 开门总量
  openTotal: number;
  // 户主数
  ownerCount: number;
  // 户主总量
  ownerTotal: number;
}

export interface IUserRecord {
  // 日期
  date: string;
  // 用户增长量
  userCount: number;
  // 总用户数
  userTotal: number;
  // 独立ip数
  ipCount: number;
  // 总访问量
  totalCount: number;
  // 实名认证数
  verifyCount: number;
  // 实名认证总量
  verifyTotal: number;
  // 黑名单数
  blackCount: number;
  // 黑名单总量
  blackTotal: number;
  // 开门数
  openCount: number;
  // 开门总量
  openTotal: number;
  // 户主数
  ownerCount: number;
  // 户主总量
  ownerTotal: number;
}

export interface IUploadRecord {
  // 日期
  date: string;
  // 一标三实
  socCount: number,
  // 一标三实总量
  socTotal: number,
  // 住户上传数
  residentCount: number;
  // 住户信息上报总量
  residentTotal: number;
  // 刷卡记录上传数
  enRecordCount: number;
  // 刷卡记录上传总量
  enRecordTotal: number;
  // 设备上传数
  deviceCount: number;
  // 设备上传总量
  deviceTotal: number;
}
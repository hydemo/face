import { Document } from 'mongoose';

export interface IBlack extends Document {
  // 审核情况 1:待审核 2:通过 3:拒绝
  readonly checkResult: number;
  // 申请人
  readonly applicant: string;
  // 申请时间
  readonly applicationTime: Date;
  // 审核时间
  readonly checkTime: Date;
  // 审核人
  readonly reviewer: string;
  // 是否删除
  readonly isDelete: boolean;
  // 申请小区
  readonly zone: string;
  // 类型 1:监控 2:报警
  readonly type: number;
  // 姓名
  readonly username: string;
  // 身份证
  readonly cardNumber: string;
  // 申请理由
  readonly reason: string;
}
import { Document } from 'mongoose';

export interface IRent extends Document {
  // 业主
  readonly owner: string;
  //出租时间
  readonly rentTime: Date;
  // 租客
  readonly tenant: string;
  // 是否删除
  readonly isDelete: boolean;
  // 申请小区
  readonly zone: string;
  // 类型 1:监控 2:报警
  readonly address: string;
}
import { Document } from 'mongoose';

export interface IResident extends Document {
  // 地址
  readonly address: any;
  // 区域
  readonly zone: string;
  // 用户
  readonly user: any;
  // 审核情况
  readonly checkResult: number;
  // 住客类型
  readonly type: string;
  // 添加时间
  readonly addTime: Date;
  // 申请时间
  readonly applicationTime: Date;
  // 是否监控
  readonly isMonitor: boolean;
  // 是否删除
  readonly isDelete: boolean;
  // 是否删除
  readonly isDisable: boolean;
  // 审核时间
  readonly checkTime: Date;
  // 有效期
  readonly expireTime: Date;
  // 审核人
  readonly reviewer: string;
  // 归属人
  readonly owner: string;
}
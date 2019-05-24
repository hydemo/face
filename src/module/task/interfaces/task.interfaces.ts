import { Document } from 'mongoose';

export interface ITask extends Document {
  // 安装人员
  readonly installer: string;
  // 安装区域
  readonly position: string;
  // 安装截止日期
  readonly expireTime: Date;
  // 是否完成
  readonly isDone: boolean;
  // 晚上时间
  readonly installTime: Date;
  // 安装区域
  readonly zone: string;
  // 安装具体位置描述
  readonly description: string;
  // 设备
  readonly device: string;
}
import { Document } from 'mongoose';

export interface IMedia extends Document {
  // 登录名
  readonly username: string;
  // 密码
  readonly password: string;
  // 区域
  readonly zone: string;
  // 区域名
  readonly zoneName: string;
}
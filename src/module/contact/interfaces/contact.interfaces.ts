import { Document } from 'mongoose';

export interface IContact extends Document {
  // 用户
  readonly user: string;
  // 联系人
  readonly contact: string;
}
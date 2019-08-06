import { Document } from 'mongoose';

export interface IArea extends Document {
  // 片区名称
  readonly name: string;
  // 省份
  readonly provianc: string;
  // 城市
  readonly city: string;
}
import { Document } from 'mongoose';

export interface IPreowner extends Document {
  // 姓名
  readonly username: string;
  // 身份证
  readonly cardNumber: string;
  // 单元房名称
  readonly building: string;
  // 房间号
  readonly houseNumber: string;
  // 小区id
  readonly zoneId: string;
  // 手机号
  readonly phone: string;
}
import { Document } from 'mongoose';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { IUser } from 'src/module/users/interfaces/user.interfaces';

export interface IFace extends Document {
  // 设备
  readonly device: IDevice;
  // 用户
  readonly user: IUser;
  // 类型
  readonly mode: number;
  // 库索引
  readonly libIndex: number;
  // 图片索引
  readonly flieIndex: number;
  // 图片名
  readonly pic: string;
  // 区域
  readonly zone: string;
}
import { Document } from 'mongoose';
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';
import { IAttribute } from './attribut.interface';

export interface IStranger extends Document {
  // 设备
  readonly device: IDevice;
  // 区域
  readonly zone: IZone;
  // 通过时间
  readonly passTime: Date;
  // 比对结果
  readonly compareResult: number;
  // 抓拍图片url
  readonly imgUrl: string;
  // 人脸背景图片数据
  readonly imgexUrl?: string;
  // 访问次数
  readonly visitCount: number;
  // 人脸质量
  readonly faceQuality: number;
  // 人脸特征值
  readonly faceFeature: string;
  // 人脸属性
  readonly attribute: IAttribute;
}
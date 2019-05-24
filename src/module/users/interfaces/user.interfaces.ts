import { Document } from 'mongoose';

export interface IUser extends Document {
  // 用户名
  readonly username: string;
  // 密码
  password: string;
  // 注册时间
  readonly registerTime: Date;
  // 注册ip
  readonly registerIp: string;
  // 手机
  readonly phone: string;
  // 微信id
  readonly weixinOpenid: string;
  // 头像
  readonly avatar: string;
  // 性别
  readonly gender: number;
  // 昵称
  readonly nickname: string;
  // 最后登录时间
  readonly lastLoginTime: Date;
  // 最后登录ip
  readonly lastLoginIp: string;
  // token
  accessToken: string;
  // 国家
  readonly country: string;
  // 省份
  readonly province: string;
  // 城市
  readonly city: string;
  // 人脸图片
  readonly faceUrl: string;
  // 身份证号
  cardNumber: string;
  // unionId
  readonly unionId: string;
  // 是否禁用
  readonly isBlock: boolean;
  // 是否实名认证
  readonly isVerify: boolean;
  // 是否手机认证
  readonly isPhoneVerify: boolean;
}
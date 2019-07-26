import { Document } from 'mongoose';

export interface IDevice extends Document {
  // 设备用户名
  readonly username: string;
  // 设备密码
  readonly password: string;
  // 设备uuid
  readonly deviceUUID: string;
  // 设备类型 1 枪机 2 门禁机
  readonly deviceType: number;
  // 通过类型 1 进入 2 离开
  readonly passType: number,
  // 算法版本
  readonly algorithmVersion: string;
  // 模型版本
  readonly modelVersion: string;
  // 软件内核版本
  readonly softwardVersion: string;
  // 是否启用
  readonly enable: boolean;
  // sim卡ID
  readonly simId: string;
  // 安装位置
  readonly position: any;
  // 安装区域
  readonly zone: string;
  // 是否绑定
  readonly isBind: boolean;
  // 区域根节点
  readonly description: string,
  // 广告机
  readonly media?: string;

  deviceId: number;

  readonly version: string;

}
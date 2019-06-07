import { Document } from 'mongoose';

export interface IZone extends Document {
  // 区域名称
  readonly name: string;
  // 所属地区
  readonly location: string;
  // 区域级别
  readonly zoneLayer: number;
  // 区域类型
  readonly zoneType: number;
  // 是否有下级区域
  readonly hasChildren: boolean;
  // 下级区域
  readonly children: string[];
  // 父级级区域
  readonly ancestor: string[];
  // 是否启用
  readonly enable: boolean;
  // 是否删除
  readonly isDelete: boolean;
  // 区域Id
  zoneId: string;
  // 父级区域
  readonly parent?: string;
  // 设备数
  readonly deviceCount: number;
  // 业主
  readonly owner: string,
  //门牌号
  houseNumber: string;
}
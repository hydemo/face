import { Document } from 'mongoose';
import { IZoneProfile } from './zonePrifile.interface';

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
  hasChildren: boolean;
  // 下级区域
  children: string[];
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
  //是否分区
  hasPartition: Boolean;
  readonly profile: IZoneProfile;
  // 建筑类型 50:建筑物 60:单元房 61：梯位
  buildingType: string;
  // 分区id
  partition: string;
  // 分区排序
  partitionSort: number;
  // 名称长度
  nameLength: number;
}
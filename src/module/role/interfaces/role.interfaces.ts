import { Document } from 'mongoose';
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';

export interface IRole extends Document {
  // 用户
  readonly user: IUser,
  // 区域
  readonly zone: IZone,
  // 角色 1:管理 2:工作人员 3:保安
  readonly role: number,
  // 轨迹
  readonly description: string,
  // 是否删除
  readonly isDelete: boolean,
}


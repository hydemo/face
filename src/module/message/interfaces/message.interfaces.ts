import { Document } from 'mongoose';
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { IOrbit } from 'src/module/orbit/interfaces/orbit.interfaces';

export interface IMessage extends Document {
  // 发送人
  readonly sender: IUser;
  // 消息类型
  readonly type: string;
  // 接收人
  readonly receiver: string;
  // 轨迹
  readonly orbit: IOrbit;
  // 内容
  readonly content: IContent[];
  // 标题
  readonly title: string;
  // 比对结果
  readonly isRead: number;
}

export interface IContent extends Document {
  // 类型
  readonly type: string;
  // 内容
  readonly content: string;
}


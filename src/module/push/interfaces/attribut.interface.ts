import { Document } from 'mongoose';

export interface IAttribute extends Document {
  // 年龄
  readonly age: number;
  // 性别 1:男 2:女
  readonly gender: number;
  // 是否佩戴眼镜 0:否 1:戴眼镜 2:戴太阳镜
  readonly glasses: number;
  // 是否戴面具 0:否 1:是
  readonly mask: number;
  // 是否留胡子 0:否 1:是 
  readonly beard: number;
  // 人种 1:黄种人 2:黑种人 3:白种人
  readonly race: number;
  // 情绪 1:生气 2:平静 3:高兴 4:悲伤 5:惊讶
  readonly emotion: number;
}
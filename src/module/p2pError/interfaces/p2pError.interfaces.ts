import { Document } from 'mongoose';

export interface IP2PError extends Document {
  // 安装人员
  readonly data: string;
}
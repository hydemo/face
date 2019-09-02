import { Document } from 'mongoose';

export interface IP2PError extends Document {
  readonly face: string;
  readonly msg: string;
  readonly type: string;
}
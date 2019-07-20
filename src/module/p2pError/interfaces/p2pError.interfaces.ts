import { Document } from 'mongoose';

export interface IP2PError extends Document {
  readonly face: string;
  readonly imgUrl: string;
}
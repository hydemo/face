import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const P2PErrorSchema = new mongoose.Schema(
  {
    face: ObjectId,
    msg: String,
    type: String,
  },
  { collection: 'p2pError', versionKey: false, timestamps: true },
);

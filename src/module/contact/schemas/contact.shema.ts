import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const ContactSchema = new mongoose.Schema(
  {
    // 用户
    user: ObjectId,
    // 联系人
    contact: ObjectId,
  },
  { collection: 'contact', versionKey: false, timestamps: true },
);

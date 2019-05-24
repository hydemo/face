import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const ZoneSchema = new mongoose.Schema(
  {
    // 区域名称
    name: String,
    // 所属地区
    location: String,
    // 区域级别
    zoneLayer: { type: Number },
    // 区域类型
    zoneType: { type: Number },
    //门牌号
    houseNumber: String,
    // 是否有下级区域
    hasChildren: { type: Boolean, default: false },
    // 下级区域
    children: { type: [String], default: [] },
    // 祖先
    ancestor: { type: [String], default: [] },
    // 是否启用
    enable: { type: Boolean, default: false },
    // 是否删除
    isDelete: { type: Boolean, default: false },
    // 区域Id
    zoneId: ObjectId,
    // 父级区域
    parent: ObjectId,
    // 业主
    owner: ObjectId,
    // 设备数
    deviceCount: { type: Number, default: 0 },
  },
  { collection: 'zone', versionKey: false, timestamps: true },
);

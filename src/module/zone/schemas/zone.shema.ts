import * as mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

export const ZoneSchema = new mongoose.Schema(
  {
    // 区域名称
    name: String,
    // 名称长度
    nameLength: Number,
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
    //是否分区
    hasPartition: { type: Boolean, default: false },
    // 建筑类型 50:建筑物 60:单元房 61：梯位
    buildingType: { type: String, enum: ['50', '60', '61'] },
    // 分区id
    partition: ObjectId,
    // 分区排序
    partitionSort: { type: Number },
    // 设备数
    deviceCount: { type: Number, default: 0 },
    // 小区参数
    profile: {
      // GUID地址编码
      dzbm: String,
      // 区县名称
      qxmc: String,
      // 区县编码
      qxbm: String,
      // 乡镇街道名称
      xzjdmc: String,
      // 乡镇街道编码
      xzjdbm: String,
      // 社区居村委名称
      sqjcwhmc: String,
      // 社区居村委编码
      sqjcwhbm: String,
      // 管辖派出所名称
      gajgmc: String,
      // 上级地址编码
      sjdzbm: String,
      // 地址全称
      dzqc: String,
      // 经度
      lng: String,
      // 经度
      lat: String,
      // 经度
      dzsx: String,
      // 经度
      mlpsxdm: String,
    }
  },
  { collection: 'zone', versionKey: false, timestamps: true },
);

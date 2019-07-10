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
    },
    propertyCo: {
      // 物业名称
      name: String,
      // 物业信用代码
      creditCode: String,
      // 物业负责人
      contact: String,
      // 是否完成
      contactPhone: String,
      // 物业地址
      address: String
    },
    // 地址详情
    detail: {
      // 门牌楼属性
      MLPSXDM: String,
      // 末端地址标志
      MDJD: String,
      // 号座
      HAOZUO: String,
      // GUID编码
      SYSTEMID: String,
      // 地市编码
      DSBM: String,
      // 地址类型
      DZLX: String,
      // 地址全称
      DZMC: String,
      // 门牌号码
      MPH: String,
      // 小区名称
      XQMC: String,
      // 小区编号
      XQDM: String,
      // 楼房名称
      JZWMC: String,
      // 楼房编号
      JZWDM: String,
      // 房号
      DYFH: String,
      // 数据归属单位代码
      GAJGJGDM: String,
      // 数据归属单位名称
      GAJGJGMC: String,
      // 警务区编号
      JWWGDM: String,
      // 警务区名称
      JWWGMC: String,
      // 乡镇（街道）代码
      XZJDDM: String,
      // 乡镇街道
      XZJDMC: String,
      // 区乡村编号
      SQJCWHDM: String,
      // 区乡村
      SQJCWHMC: String,
      // 地名编号
      DMDM: String,
      // 地名
      DMMC: String,
      // 地（住）址存在标识
      DZZCZBS: String,
      // 地（住）址在用标识
      DZZZYBS: String,
      // 启用日期
      QYRQ: String,
      // 停用日期 
      TYRQ: String,
      // X坐标
      MAPX: String,
      // X坐标
      MAPY: String,
      // 登记时间
      DJSJ: String,
      // 登记人姓名
      DJR_XM: String,
      // 登记人单位代码
      DJDW_GAJGJGDM: String,
      // 登记人单位名称
      DJDW_GAJGJGMC: String,
      // 单元梯位代码
      CELL_ID: String,
      // 单元
      CELL: String,
      // 地址元素类型
      DZYSLX: String,
      // 区县名称
      QU: String,
      // 省市县区编码
      QU_ID: String,
      // 属性
      PROPERTY: String,
    }
  },
  { collection: 'zone', versionKey: false, timestamps: true },
);

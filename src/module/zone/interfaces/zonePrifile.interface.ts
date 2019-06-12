export interface IZoneProfile {
  // GUID地址编码
  readonly dzbm: string;
  // 区县名称
  readonly qxmc: string;
  // 区县编码
  readonly qxbm: string;
  // 乡镇街道名称
  readonly xzjdmc: string;
  // 乡镇街道编码
  readonly xzjdbm: string;
  // 社区居村委名称
  readonly sqjcwhmc: string;
  // 社区居村委编码
  readonly sqjcwhbm: string;
  // 管辖派出所名称
  readonly gajgmc: string;
  // 上级地址编码
  readonly sjdzbm: string;
  // 地址全称
  readonly dzqc: string;
  // 经度
  readonly lng: string;
  // 经度
  readonly lat: string;
  // 经度
  readonly dzsx: string;
  // 经度
  readonly mlpsxdm: string;
}
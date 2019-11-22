import { Model } from 'mongoose';
import * as uuid from 'uuid/v4';
import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';
import { IZone } from './interfaces/zone.interfaces';
import { ZoneDTO, CreateZoneByScanDTO, CreateSubZoneByScanDTO } from './dto/zone.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { RedisService } from 'nestjs-redis';
import { SOCUtil } from 'src/utils/soc.util';
import { IZoneProfile } from 'src/module/zone/interfaces/zonePrifile.interface';
import { ZoneProfileDTO } from './dto/zonePrifile.dto';
import { IChildren } from './interfaces/children.interface';
import { IDetail } from './interfaces/detail.interface';
import { ZOCUtil } from 'src/utils/zoc.util';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class ZoneService {
  constructor(
    @Inject('ZoneModelToken') private readonly zoneModel: Model<IZone>,
    @Inject(SOCUtil) private socUtil: SOCUtil,
    @Inject(ZOCUtil) private zocUtil: ZOCUtil,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) { }

  // 创建数据
  // async create(createZoneDTO: CreateZoneDTO): Promise<boolean> {

  //   const zone: ZoneDTO = { ...createZoneDTO, zoneLayer: 0, parent: null, houseNumber: '', ancestor: [] }

  //   const createZone: IZone = new this.zoneModel(zone);
  //   createZone.zoneId = createZone._id;
  //   createZone.houseNumber = createZone.name;
  //   await createZone.save();
  //   return true;
  // }

  async getVisitorQrcode(user: string, zoneId: string) {

    const zone: IZone | null = await this.zoneModel.findById(zoneId)
    if (!zone) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    const key = uuid()
    const client = this.redis.getClient()
    const value = { name: zone.houseNumber, _id: zone._id, type: 'zone' };
    await client.set(key, JSON.stringify(value), 'EX', 60 * 5);
    return key
  }

  // 根据条件查询
  async findByCondition(condition: any): Promise<IZone[]> {
    return await this.zoneModel.find(condition).sort({ createdAt: -1 }).lean().exec();
  }

  // 根据条件查询
  async findOneByCondition(condition: any): Promise<IZone | null> {
    return await this.zoneModel.findOne(condition).lean().exec();
  }


  // 根据id查询
  async findById(id: string): Promise<IZone> {
    const zone = await this.zoneModel.findById(id).lean().exec();

    if (!zone) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return zone;
  }
  // 根据id查询
  async findTreeById(id: string): Promise<IZone> {
    const zone: IZone | null = await this.zoneModel
      .findById(id)
      .populate({
        path: 'children', model: 'zone', sort: { name: 1 },
        populate: {
          path: 'children', model: 'zone', sort: { name: 1 },
          populate: { path: 'children', model: 'zone', sort: { name: 1 } }
        }
      })
      .lean()
      .exec();
    if (!zone) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return zone;
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IZone>> {
    const search: any = [];
    const condition: any = { zoneLayer: 0 };
    condition.zoneType = pagination.type;
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          search.push({ name: new RegExp(sea[key], 'i') });
          search.push({ location: new RegExp(sea[key], 'i') });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    condition.isDelete = false;
    const list = await this.zoneModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .select({ children: 0 })
      .lean()
      .exec();
    const total = await this.zoneModel.countDocuments(condition);
    return { list, total };
  }

  async noOwnerZones(pagination: Pagination, zone): Promise<IList<IZone>> {
    const condition: any = { zoneLayer: 2, zoneId: zone, owner: { $exists: false }, isDelete: false };
    const list = await this.zoneModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ name: 1 })
      .lean()
      .exec();
    const total = await this.zoneModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id删除
  async deleteById(id: string): Promise<IZone> {
    return await this.zoneModel.findByIdAndDelete(id).lean().exec();
  }

  // 更新业主
  async updateOwner(id: string, owner: string) {
    return await this.zoneModel.findByIdAndUpdate(id, { owner })
  }

  // 更新业主
  async deleteOwner(id: string) {
    return await this.zoneModel.findByIdAndUpdate(id, { $unset: { owner: 1 } })
  }

  // 设备数变动
  async incDeviceCount(id: string, inc: number): Promise<boolean> {
    await this.zoneModel.findByIdAndUpdate(id, { $inc: { deviceCount: inc } })
    return true
  }
  // // 二维码获取小区信息
  // async qrcode(code: string): Promise<IZoneProfile> {
  //   const { list } = await this.socUtil.qrcodeAddress(code)
  //   return list[0]
  // }
  // 处理分区
  async partition(parent: string) {
    const partitions: IZone[] = await this.zoneModel.find({ parent, buildingType: '61' }).sort({ name: 1 })
    await Promise.all(partitions.map(async (partition, index) => {
      const name: RegExp = new RegExp(partition.name, 'i')
      await this.zoneModel.update({ name }, { partition: partition._id, partitionSort: index })
      // const children: IZone[] = await this.zoneModel.find({ name })
      // children.map(child => {
      //   if (String(child._id) === String(partition._id)) {
      //     this.zoneModel.findByIdAndUpdate(partition._id, { partition: partition._id, partitionSort: index })
      //   } else {
      //     this.zoneModel.findByIdAndUpdate(partition._id, {
      //       partition: partition._id,
      //       partitionSort: index,
      //       name: child.name.replace(partition.name, '')
      //     })
      //   }
      // })
    }))
  }
  async fix(id, newId) {
    const newZone = await this.zoneModel.findById(newId)
    if (!newZone) { return }
    const detail: IDetail = await this.socUtil.address(newZone.profile.dzbm)
    await this.zoneModel.findByIdAndUpdate(id, { detail, profile: newZone.profile })
  }

  // 创建区域对象
  async createSubZone(profile: ZoneProfileDTO, parent: IZone, buildName?: string): Promise<IZone> {
    const name = buildName ? buildName : profile.dzqc.replace(parent.profile.dzqc, '')
    // let name = buildName ? buildName : profile.dzqc.replace(parent.profile.dzqc, '')
    // name = name.replace('陶然金溪', '')

    const houseNumber = `${parent.houseNumber}-${name}`
    const create: ZoneDTO = {
      name,
      nameLength: name.length,
      location: parent.location,
      zoneLayer: parent.zoneLayer + 1,
      zoneType: parent.zoneType,
      parent: parent._id,
      profile,
      zoneId: parent.zoneId,
      ancestor: [...parent.ancestor, parent._id],
      houseNumber,
      buildingType: profile.dzsx,
      area: parent.area,
    }
    return await this.zoneModel.create(create);
  }
  // 获取子集
  async getChildren(children: IChildren, parent: IZone, code: string, layer: number): Promise<IChildren> {
    const list = await this.socUtil.qrcodeAddress(code)
    console.log(list, 'list')
    await Promise.all(list.map(async child => {
      if (child.dzbm === parent.profile.dzbm) {
        return;
      }
      if (child.dzsx === '61') {
        children.hasPartition = true
      }
      const subZone: IZone = await this.createSubZone(child, parent)
      children.children.push(String(subZone._id))
      let subChildren: IChildren = { children: [], hasPartition: false }
      if (parent.zoneLayer < 1) {
        subChildren = await this.getChildren(subChildren, subZone, child.dzbm, layer)
      }
      if (subChildren.hasPartition) {
        await this.partition(subZone._id)
      }
      subZone.children = subChildren.children;
      subZone.hasChildren = subChildren.children.length > 0
      subZone.hasPartition = subChildren.hasPartition
      await subZone.save()
    }))
    return children
  }

  async addSameSubZone(id) {
    const zone = await this.zoneModel.findById(id).lean().exec()
    delete zone._id
    zone.zoneLayer = zone.zoneLayer + 1
    zone.buildingType = '60'
    zone.parent = id
    zone.ancestor.push(id)
    const subZone = await this.zoneModel.create(zone)
    await this.zoneModel.findByIdAndUpdate(id, { hasChildren: true, $push: { children: subZone._id } })
    // console.log(zone)
  }

  async addSubZoneByQrCode(id: string, subZone: CreateSubZoneByScanDTO) {
    // const root = await this.zoneModel.findById(id).lean().exec()
    // const createParent = {
    //   name: subZone.name,
    //   nameLength: subZone.name.length,
    //   location: root.location,
    //   zoneLayer: root.zoneLayer + 1,
    //   zoneType: root.zoneType,
    //   parent: id,
    //   hasChildren: false,
    //   children: [],
    //   houseNumber: `${root.name}-${subZone.name}`,
    //   buildingType: '50',
    //   area: root.area,
    //   zoneId: root.zoneId,
    //   ancestor: [...root.ancestor, id],
    // }
    // const parent = await this.zoneModel.create(createParent)
    // await this.zoneModel.findByIdAndUpdate(id, { hasChildren: true, $push: { children: parent._id } })
    // const count = Number(subZone.layer)
    // for (let i = 1; i <= count; i++) {
    //   const name = `${i}班`
    //   const zone: any = {
    //     name,
    //     nameLength: name.length,
    //     location: parent.location,
    //     zoneLayer: parent.zoneLayer + 1,
    //     zoneType: parent.zoneType,
    //     parent: parent._id,
    //     hasChildren: false,
    //     children: [],
    //     houseNumber: `${parent.houseNumber}-${name}`,
    //     buildingType: '60',
    //     area: parent.area,
    //     zoneId: parent.zoneId,
    //     ancestor: [...parent.ancestor, parent._id],
    //   }
    //   const newSubZone: IZone = await this.zoneModel.create(zone);
    //   await this.zoneModel.findByIdAndUpdate(parent._id, { hasChildren: true, $push: { children: newSubZone._id } })
    // }
    const zone = await this.zoneModel.findById(id).lean().exec()
    const list = await this.socUtil.qrcodeAddress(subZone.code)
    let parentProfile;
    let children: string[] = []
    list.map(profile => {
      if (profile.dzbm === subZone.code) {
        parentProfile = profile
      }
    })
    const parent = await this.createSubZone(parentProfile, zone)
    await Promise.all(list.map(async child => {
      if (child.dzbm === parent.profile.dzbm) {
        return;
      }

      const subZone: IZone = await this.createSubZone(child, parent)
      children.push(String(subZone._id))
      subZone.children = [];
      subZone.hasChildren = false
      subZone.hasPartition = false
      await subZone.save()
    }))
    parent.children = children
    parent.hasChildren = children.length > 0
    parent.hasPartition = false
    await parent.save()
    await this.zoneModel.findByIdAndUpdate(id, { hasChildren: true, $push: { children: parent._id } })
    return
    // delete zone._id
    // zone.zoneLayer = zone.zoneLayer + 1
    // zone.buildingType = '60'
    // zone.parent = id
    // zone.ancestor.push(id)
    // const subZone = await this.zoneModel.create(zone)
    // await this.zoneModel.findByIdAndUpdate(id, { hasChildren: true, $push: { children: subZone._id } })
    // console.log(zone)
  }

  // 二维码添加小区
  async addByQrcode(createZone: CreateZoneByScanDTO) {
    const list = await this.socUtil.qrcodeAddress(createZone.code)
    const detail: IDetail = await this.socUtil.address(createZone.code)

    let parentProfile;
    list.map(profile => {
      if (profile.dzbm === createZone.code) {
        parentProfile = profile
      }
    })
    const parent: ZoneDTO = {
      name: createZone.name,
      nameLength: createZone.name.length,
      location: `${parentProfile.qxmc}${parentProfile.sqjcwhmc}`,
      zoneLayer: 0,
      zoneType: createZone.zoneType,
      parent: null,
      ancestor: [],
      hasChildren: list.length > 1,
      houseNumber: createZone.name,
      profile: parentProfile,
      buildingType: parentProfile.dzsx,
      area: createZone.area,
      detail,
      propertyCo: {
        name: createZone.propertyCoName,
        contact: createZone.contact,
        contactPhone: createZone.contactPhone,
        creditCode: createZone.creditCode,
        address: createZone.address,
      }
    }
    const createParent: IZone = await new this.zoneModel(parent);
    createParent.zoneId = createParent._id;
    await createParent.save()
    // const children: IChildren = await this.getChildren({ children: [], hasPartition: false }, createParent, createZone.code, createZone.layer)
    // console.log(children, 'children')
    // createParent.children = children.children
    // createParent.hasChildren = children.children.length > 0
    // createParent.hasPartition = children.hasPartition
    // await this.zoneModel.findByIdAndUpdate(createParent._id, { children: children.children, hasPartition: children.hasPartition })
    // 上报物业信息
    // const time = moment().format('YYYYMMDDHHmmss');
    // const zip = await this.zocUtil.genZip()
    // await this.zocUtil.genPropertyCo(zip, time, createParent.propertyCo, createParent.detail)
    // const zocResult: any = await this.zocUtil.upload(zip, time)
    // if (zocResult.success) {
    //   await this.zoneModel.findByIdAndUpdate(createParent._id, { isZOCPush: true, ZOCZip: zocResult.zipname, upTime: Date.now() })
    //   const client = this.redis.getClient()
    //   await client.hincrby(this.config.LOG, this.config.LOG_PROPERTYCO, 1)
    // }

  }

  // 二维码添加小区
  async addByNoQrcode(createZone: CreateZoneByScanDTO) {
    // const list = await this.socUtil.qrcodeAddress(createZone.code)
    // const detail: IDetail = await this.socUtil.address(createZone.code)
    // // console.log(detail, 'detail')

    // let parentProfile;
    // list.map(profile => {
    //   if (profile.dzbm === createZone.code) {
    //     parentProfile = profile
    //   }
    // })

    const parent: any = {
      name: createZone.name,
      nameLength: createZone.name.length,
      // location: `${detail.QU}${detail.SQJCWHMC}`,
      zoneLayer: 0,
      zoneType: createZone.zoneType,
      parent: null,
      ancestor: [],
      hasChildren: true,
      // profile: parentProfile,
      houseNumber: createZone.name,
      buildingType: '50',
      area: createZone.area,
      // detail,
      // propertyCo: {
      //   name: createZone.propertyCoName,
      //   contact: createZone.contact,
      //   contactPhone: createZone.contactPhone,
      //   creditCode: createZone.creditCode,
      //   address: createZone.address,
      // }
    }
    const createParent: IZone = await new this.zoneModel(parent);
    createParent.zoneId = createParent._id;
    await createParent.save()
    // 上报物业信息
    // if (this.config.url === 'https://xms.thinkthen.cn') {
    //   const time = moment().format('YYYYMMDDHHmmss');
    //   const zip = await this.zocUtil.genZip()
    //   await this.zocUtil.genPropertyCo(zip, time, createParent.propertyCo, createParent.detail)
    //   const zocResult: any = await this.zocUtil.upload(zip, time)
    //   if (zocResult.success) {
    //     await this.zoneModel.findByIdAndUpdate(createParent._id, { isZOCPush: true, ZOCZip: zocResult.zipname, upTime: Date.now() })
    //     const client = this.redis.getClient()
    //     await client.hincrby(this.config.LOG, this.config.LOG_PROPERTYCO, 1)
    //   }
    // }


  }

  //获取子集
  async findSubZone(parent: string): Promise<IList<IZone>> {
    let condition: any = { parent, isDelete: false, buildingType: { $ne: '61' } };

    const list = await this.zoneModel
      .find(condition)
      .select({ name: 1, _id: 1, hasChildren: 1, houseNumber: 1, owner: 1, buildingType: 1 })
      .sort({ nameLength: 1, name: 1 })
    const total = await this.zoneModel
      .countDocuments(condition)
      .exec()
    return { list, total };
  }
  // 获取常住人子集
  async findFamilySubZone(parent: string, zones: string[]): Promise<any> {
    return {
      buildingType: { $ne: '61' },
      parent,
      isDelete: false,
      owner: { $exists: true },
      _id: { $nin: zones }
    }
  }
  // 获取业主子集
  async findOwnerSubZone(parent: string): Promise<any> {
    return {
      buildingType: { $ne: '61' },
      parent,
      isDelete: false,
      owner: { $exists: false },
    }
  }
  // 获取显示子集
  async findShowSubZone(parent: string): Promise<any> {
    return {
      buildingType: { $ne: '61' },
      parent,
      isDelete: false,
    }
  }
  // 根据条件计数
  async countByCondition(condition: any) {
    return this.zoneModel.countDocuments(condition)
  }
}
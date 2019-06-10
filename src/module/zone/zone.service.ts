import { Model } from 'mongoose';
import * as uuid from 'uuid/v4';
import { Inject, Injectable } from '@nestjs/common';
import { IZone } from './interfaces/zone.interfaces';
import { CreateZoneDTO, ZoneDTO } from './dto/zone.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { RoleService } from '../role/role.service';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class ZoneService {
  constructor(
    @Inject('ZoneModelToken') private readonly zoneModel: Model<IZone>,
    @Inject(RoleService) private readonly roleService: RoleService,
    private readonly redis: RedisService,
  ) { }

  // 创建数据
  async create(createZoneDTO: CreateZoneDTO): Promise<boolean> {

    const zone: ZoneDTO = { ...createZoneDTO, zoneLayer: 0, parent: null, houseNumber: '' }

    const createZone: IZone = new this.zoneModel(zone);
    createZone.zoneId = createZone._id;
    createZone.houseNumber = createZone.name;
    await createZone.save();
    return true;
  }

  async getVisitorQrcode(user: string, zoneId: string) {
    const canActive = await this.roleService.checkRoles({ user, role: 3, zone: zoneId, isDelete: false })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
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
    return await this.zoneModel.find(condition).lean().exec();
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
        path: 'children', model: 'zone', sort: 'name',
        populate: {
          path: 'children', model: 'zone', sort: 'name',
          populate: { path: 'children', model: 'zone', sort: 'name' }
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

  // 设备数变动
  async incDeviceCount(id: string, inc: number): Promise<boolean> {
    await this.zoneModel.findByIdAndUpdate(id, { $inc: { deviceCount: inc } })
    return true
  }

  // 新增下级区域
  async createSubZone(zone: CreateZoneDTO, parent: string): Promise<IZone> {
    const parentZone: any | null = await this.zoneModel.findById(parent);
    if (!parentZone) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    const houseNumber = `${parentZone.houseNumber}-${zone.name}`
    const create: ZoneDTO = {
      ...zone,
      parent,
      zoneId: parentZone.zoneId,
      location: parentZone.location,
      ancestor: [...parentZone.ancestor, parent],
      zoneLayer: parentZone.zoneLayer + 1,
      zoneType: parentZone.zoneType,
      houseNumber,
    }
    const createZone: IZone = await this.zoneModel.create(create);
    await this.zoneModel.findByIdAndUpdate(parent, { hasChildren: true, $addToSet: { children: createZone._id } })
    parentZone.children.push(createZone)

    return await this.findTreeById(parentZone.zoneId);
  }

  // async getHouseNumber(id: string): Promise<string> {
  //   const zone: any | null = await this.zoneModel
  //     .findById(id)
  //     .populate({
  //       path: 'ancestor', model: 'zone', select: 'name',
  //       populate: {
  //         path: 'ancestor', model: 'zone', select: 'name',
  //         populate: { path: 'ancestor', model: 'zone', select: 'name' }
  //       }
  //     })
  //     .lean()
  //     .exec();
  //   if (!zone) {
  //     throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
  //   }
  //   let ancestor: string = ''
  //   zone.ancestor.map(ances => {
  //     if (ancestor) {
  //       ancestor = `${ancestor}-${ances.name}`
  //     } else {
  //       ancestor = ances.name
  //     }
  //   })
  //   if (ancestor) {
  //     return `${ancestor}-${zone.name}`
  //   } else {
  //     return zone.name
  //   }
  // }
}
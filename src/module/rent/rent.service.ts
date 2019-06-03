import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IRent } from './interfaces/rent.interfaces';
import { CreateRentDTO, RentDTO } from './dto/rent.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CameraUtil } from 'src/utils/camera.util';
import { IUser } from '../users/interfaces/user.interfaces';
import { IZone } from '../zone/interfaces/zone.interfaces';
import { WeixinUtil } from 'src/utils/weixin.util';

@Injectable()
export class RentService {
  constructor(
    @Inject('RentModelToken') private readonly rentModel: Model<IRent>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
  ) { }

  async rent(user: string, address: IZone, createRent: CreateRentDTO): Promise<IRent> {
    const tenant: IUser = await this.weixinUtil.scan(createRent.key)
    if (address.owner !== tenant._id) {
      throw new ApiException('无权限操作', ApiErrorCode.INTERNAL_ERROR, 500);
    }
    const rent: RentDTO = {
      tenant: tenant._id,
      owner: user,
      rentTime: new Date(),
      address: address._id,
      zone: address.zoneId,
    }
    return await this.rentModel.create(rent);
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IRent>> {
    const search: any = [];
    const condition: any = {};
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.rentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device', populate: { path: 'zone', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.rentModel.countDocuments(condition);
    return { list, total };
  }

  // 用户列表
  async findByZone(pagination: Pagination, zone: string): Promise<IList<IRent>> {
    const search: any = [];
    const condition: any = {
      // zone: { $in: zone }
    };
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const username: RegExp = new RegExp(sea[key], 'i');
          search.push({ username });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.rentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device', populate: { path: 'zone', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.rentModel.countDocuments(condition);
    return { list, total };
  }
  // // 根据条件更新
  // async updatePic(condition: any, user: IUser) {
  //   const rents: IRent[] = await this.rentModel.find(condition).populate({ path: 'device', model: 'device' })
  //   return await Promise.all(rents.map(async rent => {
  //     const result = await this.cameraUtil.updateOnePic(rent, user)
  //     const update = {
  //       libIndex: result.LibIndex,
  //       flieIndex: result.FlieIndex,
  //       pic: result.pic,
  //     }
  //     await this.rentModel.findByIdAndUpdate(rent._id, update)
  //   }))
  // }
  // async updateByCondition(condition: any, update: any) {
  //   return await this.rentModel.updateMany(condition, update)
  // }
}
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
import { ResidentService } from '../resident/resident.service';

@Injectable()
export class RentService {
  constructor(
    @Inject('RentModelToken') private readonly rentModel: Model<IRent>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
    @Inject(ResidentService) private readonly residentService: ResidentService,
  ) { }

  async rent(user: string, address: IZone, createRent: CreateRentDTO): Promise<IRent> {
    const rentAlready = await this.rentModel.countDocuments({ owner: user, isRecyle: false, isDelete: false, address: address._id })
    if (rentAlready) {
      throw new ApiException('房屋已出租', ApiErrorCode.RENT_ALREADY, 406);
    }
    const tenant: IUser = await this.weixinUtil.scan(createRent.key)
    if (String(address.owner) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.INTERNAL_ERROR, 403);
    }
    const rent: RentDTO = {
      tenant: tenant._id,
      owner: user,
      rentTime: new Date(),
      address: address._id,
      zone: address.zoneId,
    }
    await this.residentService.rent(tenant, address);
    return await this.rentModel.create(rent);
  }

  async recyle(user: string, address: IZone) {
    if (String(address.owner) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.INTERNAL_ERROR, 403);
    }
    await this.residentService.rentRecyle(address);
    return await this.rentModel.findOneAndUpdate({ address: address._id, isRecyle: false }, { isRecyle: true, recyleTime: Date.now() })
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
  async findMyRent(pagination: Pagination, user: string, address: string): Promise<IList<IRent>> {
    const condition: any = { address, owner: user };
    const list = await this.rentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'tenant', model: 'user' })
      .lean()
      .exec();
    const total = await this.rentModel.countDocuments(condition);
    return { list, total };
  }

  // 用户列表
  async countByCondition(condition: any): Promise<number> {
    return await this.rentModel.countDocuments(condition);
  }
}
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IBlack } from './interfaces/black.interfaces';
import { CreateBlackDTO, BlackDTO } from './dto/black.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CameraUtil } from 'src/utils/camera.util';
import { IUser } from '../users/interfaces/user.interfaces';
import { RoleService } from '../role/role.service';

@Injectable()
export class BlackService {
  constructor(
    @Inject('BlackModelToken') private readonly blackModel: Model<IBlack>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(RoleService) private readonly roleService: RoleService,
  ) { }

  async addToZone(user: string, zone: string, createBlack: CreateBlackDTO): Promise<IBlack> {
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限', ApiErrorCode.NO_PERMISSION, 403);
    }
    const black: BlackDTO = {
      ...createBlack,
      applicant: user,
      applicationTime: new Date(),
      checkResult: 1,
      zone,
    }
    return await this.blackModel.create(black);
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IBlack>> {
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
    const list = await this.blackModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device', populate: { path: 'zone', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.blackModel.countDocuments(condition);
    return { list, total };
  }

  // 黑名单列表
  async findByZone(pagination: Pagination, zone: string, user: string): Promise<IList<IBlack>> {
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition: any = {
      zone,
      isDelete: false,
    };
    const list = await this.blackModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ checkResult: 1 })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.blackModel.countDocuments(condition);
    return { list, total };
  }
  // // 根据条件更新
  // async updatePic(condition: any, user: IUser) {
  //   const blacks: IBlack[] = await this.blackModel.find(condition).populate({ path: 'device', model: 'device' })
  //   return await Promise.all(blacks.map(async black => {
  //     const result = await this.cameraUtil.updateOnePic(black, user)
  //     const update = {
  //       libIndex: result.LibIndex,
  //       flieIndex: result.FlieIndex,
  //       pic: result.pic,
  //     }
  //     await this.blackModel.findByIdAndUpdate(black._id, update)
  //   }))
  // }
  // async updateByCondition(condition: any, update: any) {
  //   return await this.blackModel.updateMany(condition, update)
  // }
}
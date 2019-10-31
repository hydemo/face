import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IStranger } from './interfaces/stranger.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateStrangerDTO } from './dto/stranger.dto';
import { RoleService } from '../role/role.service';
import moment from 'moment'

@Injectable()
export class StrangerService {
  constructor(
    @Inject('StrangerModelToken') private readonly strangerModel: Model<IStranger>,
    @Inject(RoleService) private readonly roleService: RoleService,
  ) { }

  // 创建数据
  async create(createStrangerDTO: CreateStrangerDTO): Promise<IStranger> {
    const creatStranger = new this.strangerModel(createStrangerDTO);
    await creatStranger.save();
    return creatStranger;
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IStranger>> {
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
    const list = await this.strangerModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ passTime: -1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    const total = await this.strangerModel.countDocuments(condition);
    return { list, total };
  }

  // 黑名单列表
  async findByZone(pagination: Pagination, zone: string, user: string) {
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: { $in: [1, 5] }, user, zone })
    if (!canActive) {
      throw new ApiException('无权限', ApiErrorCode.NO_PERMISSION, 403);
    }
    const today = moment().startOf('d').format('YYYY-MM-DD HH:mm:ss')
    const todayCount = await this.strangerModel.countDocuments({ isDelete: false, zone, passTime: { $gte: today } })
    const total = await this.strangerModel.countDocuments({ isDelete: false, zone })

    const list = await this.strangerModel
      .find({ isDelete: false, zone })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ checkResult: 1 })
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'position', model: 'zone' })
      .lean()
      .exec();
    return { list, total, todayCount };
  }
}
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IStranger } from './interfaces/stranger.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateStrangerDTO } from './dto/stranger.dto';

@Injectable()
export class StrangerService {
  constructor(
    @Inject('StrangerModelToken') private readonly strangerModel: Model<IStranger>,
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
}
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IOrbit } from './interfaces/orbit.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateOrbitDTO } from './dto/orbit.dto';

@Injectable()
export class OrbitService {
  constructor(
    @Inject('OrbitModelToken') private readonly orbitModel: Model<IOrbit>,
  ) { }

  // 创建数据
  async create(createOrbitDTO: CreateOrbitDTO): Promise<IOrbit> {
    const creatOrbit = new this.orbitModel(createOrbitDTO);
    await creatOrbit.save();
    return creatOrbit;
  }
  // 根据条件查询
  async findByCondition(condition: any): Promise<IOrbit[]> {
    return await this.orbitModel.find(condition).lean().exec();
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IOrbit>> {
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
    const list = await this.orbitModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ passTime: -1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    const total = await this.orbitModel.countDocuments(condition);
    return { list, total };
  }
}
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IArea } from './interfaces/area.interfaces';
import { CreateAreaDTO } from './dto/area.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateDeviceDTO } from '../device/dto/device.dto';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';

@Injectable()
export class AreaService {
  constructor(
    @Inject('AreaModelToken') private readonly areaModel: Model<IArea>,
  ) { }

  // 创建数据
  async create(createAreaDTO: CreateAreaDTO): Promise<IArea> {
    const creatArea = new this.areaModel(createAreaDTO);
    await creatArea.save();
    return creatArea;
  }

  async list(pagination: Pagination): Promise<IList<IArea>> {
    const list: IArea[] = await this.areaModel
      .find()
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
    const total: number = await this.areaModel.countDocuments()
    return { list, total }
  }

}
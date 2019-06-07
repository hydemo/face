import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IDevice } from './interfaces/device.interfaces';
import { CreateDeviceDTO } from './dto/device.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { ZoneService } from '../zone/zone.service';
import { TaskService } from '../task/task.service';
import { ITask } from '../task/interfaces/task.interfaces';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DeviceModelToken') private readonly deviceModel: Model<IDevice>,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
  ) { }

  // 创建数据
  async create(createDeviceDTO: CreateDeviceDTO): Promise<IDevice> {
    const creatDevice = new this.deviceModel(createDeviceDTO);
    await creatDevice.save();
    await this.zoneService.incDeviceCount(creatDevice.zone, 1);
    return creatDevice;
  }
  // 根据条件查询
  async findByCondition(condition: any): Promise<IDevice[]> {
    return await this.deviceModel.find(condition).lean().exec();
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IDevice>> {
    const search: any = [];
    const condition: any = {};
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          search.push({ deviceUUID: new RegExp(sea[key], 'i') });
          search.push({ algorithmVersion: new RegExp(sea[key], 'i') });
          search.push({ modelVersion: new RegExp(sea[key], 'i') });
          search.push({ softwareVersion: new RegExp(sea[key], 'i') });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.deviceModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    const total = await this.deviceModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id查询
  async findById(_id: string): Promise<IDevice> {
    return await this.deviceModel.findById(_id).lean().exec();
  }

  // 根据id删除
  async deleteById(_id: string) {
    return await this.deviceModel.findByIdAndDelete(_id).exec();
  }

  // 根据uuid查找设备
  async findByUUID(deviceUUID: string): Promise<IDevice | null> {
    return await this.deviceModel
      .findOne({ deviceUUID })
      .populate({ path: 'position', model: 'zone' })
      .lean()
      .exec()
  }

  // 根据uuid查找设备
  async findByZoneId(zone: string): Promise<IDevice[]> {
    return await this.deviceModel.find({ zone }).lean().exec()
  }

  // // 绑定旧sim卡
  // async bindOldSim(_id: string, simId: string) {
  //   const device = await this.deviceModel.findById(_id);
  //   await this.deviceModel.findByIdAndUpdate(_id, { simId });
  //   await this.simService.updateById(device.simId, { isBind: false });
  //   return await this.simService.updateById(simId, { isBind: true });
  // }

  // async unbindSim(_id: string) {
  //   const device = await this.deviceModel.findById(_id);
  //   await this.deviceModel.findByIdAndUpdate(_id, { $unset: { simId: '' } });
  //   return await this.simService.updateById(device.simId, { isBind: false });
  // }
}
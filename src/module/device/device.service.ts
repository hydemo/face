import { Model } from 'mongoose';
import * as moment from 'moment';
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
import { ZOCUtil } from 'src/utils/zoc.util';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DeviceModelToken') private readonly deviceModel: Model<IDevice>,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
    @Inject(ZOCUtil) private readonly zocUtil: ZOCUtil,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) { }
  // 获取设备id
  async getDeviceId() {
    const deviceExist = await this.deviceModel.find().sort({ deviceId: -1 }).limit(1)
    if (!deviceExist.length) {
      return 180000001
    }
    return deviceExist[0].deviceId + 1
  }
  // 上报设备至智能感知平台
  async uploadToZoc(zoneId: string, device: IDevice) {
    const zone = await this.zoneService.findById(zoneId)
    const time = moment().format('YYYYMMDDHHmmss');
    const zip = await this.zocUtil.genZip()
    await this.zocUtil.genBasicAddr(zip, time, zone.detail)
    await this.zocUtil.genManufacturer(zip, time)
    await this.zocUtil.genPropertyCo(zip, time, zone.propertyCo, zone.detail)
    await this.zocUtil.genDevice(zip, time, zone.detail, device)
    const result = await this.zocUtil.upload(zip, time)
    if (result.success) {
      await this.deviceModel.findByIdAndUpdate(device._id, { isZOCPush: true, ZOCZip: result.zipname, upTime: Date.now() })
      const client = this.redis.getClient()
      await client.hincrby(this.config.LOG, this.config.LOG_DEVICE, 1)
    }
  }

  // 创建数据
  async create(createDeviceDTO: CreateDeviceDTO): Promise<IDevice> {
    const creatDevice = new this.deviceModel(createDeviceDTO);
    creatDevice.deviceId = await this.getDeviceId()
    await creatDevice.save();
    // this.uploadToZoc(createDeviceDTO.zone, creatDevice)
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

  // 绑定旧sim卡
  async bindMedia(_id: string, media: string) {
    return await this.deviceModel.findByIdAndUpdate(_id, { media });
  }

  async unbindMedia(_id: string) {
    return await this.deviceModel.findByIdAndUpdate(_id, { $unset: { media: 1 } });
  }
  // 更新session
  async updateSession(deviceUUID: String, session: string) {
    return await this.deviceModel.findOneAndUpdate({ deviceUUID }, { session });
  }
}
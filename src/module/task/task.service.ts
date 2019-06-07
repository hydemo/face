import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { ITask } from './interfaces/task.interfaces';
import { CreateTaskDTO } from './dto/task.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateDeviceDTO } from '../device/dto/device.dto';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';

@Injectable()
export class TaskService {
  constructor(
    @Inject('TaskModelToken') private readonly taskModel: Model<ITask>,
    @Inject('DeviceService') private readonly deviceService: DeviceService,
  ) { }

  // 创建数据
  async create(createTaskDTO: CreateTaskDTO): Promise<ITask> {
    const creatTask = new this.taskModel(createTaskDTO);
    await creatTask.save();
    return creatTask;
  }
  // 根据zoneId查询
  async findByZoneId(zoneId: string): Promise<ITask[]> {
    return await this.taskModel.find({ zoneId }).lean().exec();
  }

  // 根据id查询
  async findById(id: string): Promise<ITask> {
    const task: ITask | null = await this.taskModel.findById(id).lean().exec();
    if (!task) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return task;
  }

  // 根据id查询
  async findDetailById(id: string): Promise<ITask> {
    const task: ITask | null = await this.taskModel
      .findById(id)
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'position', model: 'zone' })
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'installer', model: 'user' })
      .lean()
      .exec();
    if (!task) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return task;
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<ITask>> {
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
    const list = await this.taskModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ isDone: -1 })
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'position', model: 'zone' })
      .populate({ path: 'installer', model: 'user' })
      .lean()
      .exec();
    const total = await this.taskModel.countDocuments(condition);
    return { list, total };
  }

  // 查询全部数据
  async findByUser(pagination: Pagination, installer: string): Promise<IList<ITask>> {
    const condition: any = { installer }
    const list = await this.taskModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ isDone: -1 })
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'position', model: 'zone' })
      .lean()
      .exec();
    const total = await this.taskModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id删除
  async deleteById(id: string): Promise<ITask> {
    return await this.taskModel.findByIdAndDelete(id).lean().exec();
  }

  // 执行任务
  async doTask(id: string, device: CreateDeviceDTO): Promise<ITask> {
    const existing = await this.deviceService.findByUUID(device.deviceUUID);
    if (existing) {
      throw new ApiException('设备已存在', ApiErrorCode.DEVICE_EXIST, 406);
    }
    const task: ITask = await this.findById(id)

    const createDevice: CreateDeviceDTO = {
      ...device,
      position: task.position,
      description: task.description,
      zone: task.zone
    }

    const data: IDevice = await this.deviceService.create(createDevice);

    await this.taskModel.findByIdAndUpdate(id, {
      isDone: true,
      device: data._id,
      installTime: Date.now()
    })
    return task
  }
}
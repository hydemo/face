import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IResident } from './interfaces/resident.interfaces';
import { CreateResidentDTO, ResidentDTO } from './dto/resident.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { IUser } from '../users/interfaces/user.interfaces';
import { ZoneService } from '../zone/zone.service';
import { UserService } from '../users/user.service';
import { IZone } from '../zone/interfaces/zone.interfaces';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';
import { CameraUtil } from 'src/utils/camera.util';
import { FaceService } from '../face/face.service';
import { CreateFaceDTO } from '../face/dto/face.dto';

@Injectable()
export class ResidentService {
  constructor(
    @Inject('ResidentModelToken') private readonly residentModel: Model<IResident>,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(FaceService) private readonly faceService: FaceService,
  ) { }

  // 创建数据
  async create(createResidentDTO: CreateResidentDTO): Promise<IResident> {
    const creatResident = new this.residentModel(createResidentDTO);
    await creatResident.save();
    return creatResident;
  }
  // 根据zoneId查询
  async findByZoneId(zoneId: string): Promise<IResident[]> {
    return await this.residentModel.find({ zoneId }).lean().exec();
  }
  // 业主申请
  async ownerApplication(createResidentDTO: CreateResidentDTO, user: IUser): Promise<IResident> {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const resident: ResidentDTO = {
      ...createResidentDTO,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'owner',
    }
    const creatResident = await this.residentModel.create(resident);
    return creatResident;
  }

  // 常住人申请
  async familyApplication(createResidentDTO: CreateResidentDTO, user: IUser): Promise<IResident> {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const resident: ResidentDTO = {
      ...createResidentDTO,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'family',
    }
    const creatResident = await this.residentModel.create(resident);
    return creatResident;
  }

  // 审核通过
  async agree(id: string): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    const zoneIds = [...resident.zone.ancestor, id]
    const devices: IDevice[] = await this.deviceService.findByCondition({ position: { $in: zoneIds } })

    await Promise.all(devices.map(async device => {
      const result: any = await this.cameraUtil.addOnePic(device, resident.user, 2)
      if (!result) {
        throw new ApiException('上传失败', ApiErrorCode.INTERNAL_ERROR, 500);
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: resident.user._id,
        mode: 2,
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.pic,
      }
      await this.faceService.create(face);
    }))

    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    return true;
  }

  // 拒绝
  async reject(id: string): Promise<boolean> {
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
    })
    return true;
  }



  // 根据id查询
  async findById(id: string): Promise<IResident> {
    const resident: IResident | null = await this.residentModel.findById(id).lean().exec();
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return resident;
  }

  // 查询全部数据
  async getOwnerApplications(pagination: Pagination, condition: any): Promise<IList<IResident>> {
    const search: any = [];
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const value = sea[key].trim();
          console.log(value, 'value')
          const zones: IZone[] = await this.zoneService.findByCondition({ name: new RegExp(value, 'i') });
          const users: IUser[] = await this.userService.findByCondition({ username: new RegExp(value, 'i') });
          const zoneIds: string[] = zones.map(zone => zone._id)
          const userIds: string[] = users.map(user => user._id)
          search.push({ zone: { $in: zoneIds } });
          search.push({ user: { $in: userIds } })
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.residentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.residentModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id删除
  async deleteById(id: string): Promise<IResident> {
    return await this.residentModel.findByIdAndDelete(id).lean().exec();
  }

  // 执行任务
  async doResident(id: String): Promise<IResident> {
    const resident: IResident | null = await this.residentModel.findByIdAndUpdate(id, {
      isDone: true,
      installTime: Date.now()
    })
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return resident
  }
}
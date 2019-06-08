import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IBlack } from './interfaces/black.interfaces';
import { CreateBlackDTO, BlackDTO } from './dto/black.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CameraUtil } from 'src/utils/camera.util';
import { RoleService } from '../role/role.service';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';
import { ConfigService } from 'src/config/config.service';
import { CreateFaceDTO } from '../face/dto/face.dto';
import { FaceService } from '../face/face.service';

@Injectable()
export class BlackService {
  constructor(
    @Inject('BlackModelToken') private readonly blackModel: Model<IBlack>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FaceService) private readonly faceService: FaceService,
  ) {

  }
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
  async getTail(skip: number, zone: string, user: string): Promise<IBlack | null> {
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
      .sort({ role: 1 })
      .limit(1)
      .skip(skip - 1)
      .sort({ applicationTime: -1 })
      .populate({ path: 'applicant', model: 'user' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    if (list.length) {
      return list[0]
    } else {
      return null
    }

  }

  // 查询全部数据
  async findAll(pagination: Pagination, checkResult: number): Promise<IList<IBlack>> {
    const condition: any = { checkResult };
    const list = await this.blackModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ applicationTime: -1 })
      .populate({ path: 'applicant', model: 'user' })
      .populate({ path: 'zone', model: 'zone' })
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
      .lean()
      .exec();
    const total = await this.blackModel.countDocuments(condition);
    return { list, total };
  }


  // 根据id查询
  async findById(id: string): Promise<IBlack | null> {
    return await this.blackModel
      .findById(id)
      .populate({ path: 'applicant', model: 'user' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .lean()
      .exec();
  }

  // 接受黑名单申请
  async agree(id: string, userId: string) {
    const black: IBlack = await this.blackModel
      .findById(id)
      .lean()
      .exec()
    const devices: IDevice[] = await this.deviceService.findByZoneId(black.zone)
    devices.map(async device => {
      const result: any = await this.cameraUtil.addOnePic(device, black, this.config.blackMode)
      if (!result) {
        throw new ApiException('上传失败', ApiErrorCode.INTERNAL_ERROR, 500);
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: black._id,
        mode: 2,
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.pic,
        bondToObjectId: black._id,
        zone: black.zone,
      }

      await this.faceService.create(face);
    })
    await this.blackModel.findByIdAndUpdate(id, {
      checkResult: 2,
      checkTime: new Date(),
      reviewer: userId,
    })
    return true;
  }

  // 黑名单审核不通过
  async reject(id: string, reviewer: string): Promise<boolean> {
    await this.blackModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
      reviewer,
    })
    return true;
  }
}
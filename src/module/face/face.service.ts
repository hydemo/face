import { Model } from 'mongoose';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { IFace } from './interfaces/face.interfaces';
import { CreateFaceDTO } from './dto/face.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CameraUtil } from 'src/utils/camera.util';
import { IUser } from '../users/interfaces/user.interfaces';
import { IDevice } from '../device/interfaces/device.interfaces';
import { ResidentService } from '../resident/resident.service';

@Injectable()
export class FaceService {
  constructor(
    @Inject('FaceModelToken') private readonly faceModel: Model<IFace>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(forwardRef(() => ResidentService)) private readonly residentService: ResidentService,
  ) { }

  // 创建数据
  async create(createFaceDTO: CreateFaceDTO): Promise<IFace> {
    const creatFace = new this.faceModel(createFaceDTO);
    await creatFace.save();
    return creatFace;
  }
  // 根据条件查询
  async findByCondition(condition: any): Promise<IFace[]> {
    return await this.faceModel.find(condition).lean().exec();
  }
  // 根据条件查询
  async findOne(condition: any): Promise<IFace | null> {
    return await this.faceModel.findOne(condition).lean().exec();
  }

  // 根据条件查询
  async findById(id: string): Promise<IFace | null> {
    return await this.faceModel.findById(id).lean().exec();
  }
  // 统计数量
  async count(condition: any): Promise<number> {
    return await this.faceModel.countDocuments(condition).lean().exec();
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IFace>> {
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
    const list = await this.faceModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device', populate: { path: 'zone', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.faceModel.countDocuments(condition);
    return { list, total };
  }

  // 用户列表
  async findByZone(pagination: Pagination, zone: string): Promise<IList<IFace>> {
    const search: any = [];
    const condition: any = {
      // zone: { $in: zone }
    };
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const username: RegExp = new RegExp(sea[key], 'i');
          search.push({ username });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.faceModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ status: 1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'device', model: 'device', populate: { path: 'zone', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.faceModel.countDocuments(condition);
    return { list, total };
  }
  // 判断是否上传过
  genFaces(deviceFaces, deviceId, face: IFace) {
    let isAdd = false
    deviceFaces.map(deviceFace => {
      if (deviceFace.deviceId === deviceId) {
        deviceFace.faces.push(face)
        if (face.mode > 1) {
          deviceFace.mode = face.mode
        }
        isAdd = true
      }
    })
    if (!isAdd) {
      const faces = [face]
      deviceFaces.push({ deviceId: deviceId, faces, mode: face.mode })
    }
    return
  }
  // 根据条件更新
  async updatePic(user: IUser, img: string) {
    await this.residentService.updateByUser(user._id)
    const faces: IFace[] = await this.faceModel.find({ user: user._id, isDelete: false }).populate({ path: 'device', model: 'device' })
    const deviceFaces: any = []
    for (let face of faces) {
      await this.faceModel.findByIdAndUpdate(face._id, { checkResult: 1, faceUrl: img })
      this.genFaces(deviceFaces, String(face.device._id), face)
    }
    deviceFaces.map(async deviceFace => {
      await this.cameraUtil.updateOnePic(deviceFace.faces, user, img, deviceFace.mode)
    })
  }

  // 根据条件更新
  async addOnePic(face: CreateFaceDTO, device: IDevice, user: IUser, mode: number, img: string, ) {
    // if (device.version === '1.1.0') {
    //   // const exist = await this.cameraUtil.getPersionInfo(user._id, device, mode)
    //   // if (exist) {
    //     return await this.faceModel.create({ ...face, checkResult: 2 })
    //   }
    // }
    const createFace = await this.faceModel.create(face)
    return await this.cameraUtil.addOnePic(device, user, mode, img, createFace)
  }

  // 根据id删除
  async delete(face: IFace) {
    const faceCount: number = await this.count({ isDelete: false, device: face.device, user: face.user, checkResult: 2 })
    const faceToDelete: any = await this.faceModel.findById(face._id).populate({ path: 'device', model: 'device' })
    if (faceCount === 1 && faceToDelete) {
      // const exist = await this.cameraUtil.getPersionInfo(faceToDelete.user, faceToDelete.device, faceToDelete.mode)
      // if (exist) {
      await this.cameraUtil.deleteOnePic(faceToDelete)
      // }
    }
    await this.faceModel.findByIdAndUpdate(face._id, { isDelete: true, checkResult: 1 })
    return true
  }

  // 根据id删除
  async checkResult(bondToObjectId: string): Promise<number> {
    const isFail = await this.faceModel.findOne({ bondToObjectId, checkResult: 3 })
    const isPending = await this.faceModel.findOne({ bondToObjectId, checkResult: 1 })
    if (isFail) {
      return 5
    }
    if (isPending) {
      return 4
    }
    return 2
  }

  async updateByCondition(condition: any, update: any) {
    return await this.faceModel.updateMany(condition, update)
  }
  async updateById(id: string, update: any) {
    return await this.faceModel.findByIdAndUpdate(id, update)
  }
}
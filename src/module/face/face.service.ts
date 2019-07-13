import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IFace } from './interfaces/face.interfaces';
import { CreateFaceDTO } from './dto/face.dto';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CameraUtil } from 'src/utils/camera.util';
import { IUser } from '../users/interfaces/user.interfaces';

@Injectable()
export class FaceService {
  constructor(
    @Inject('FaceModelToken') private readonly faceModel: Model<IFace>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
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
  // 根据条件更新
  async updatePic(condition: any, user: IUser, img: string) {
    const faces: IFace[] = await this.faceModel.find(condition).populate({ path: 'device', model: 'device' })
    return await Promise.all(faces.map(async face => {
      const result = await this.cameraUtil.updateOnePic(face, user, img)
      if(!result) {
        return
      }
      const update = {
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.Pic,
      }
      await this.faceModel.findByIdAndUpdate(face._id, update)
    }))
  }

  // 根据id删除
  async delete(face: IFace) {
    const faceCount: number = await this.count({ isDelete: false, device: face.device, user: face.user })
    console.log(faceCount, 'faceCount')
    const faceToDelete: IFace | null = await this.faceModel.findById(face._id).populate({ path: 'device', model: 'device' })
    if (faceCount === 1 && faceToDelete) {
      await this.cameraUtil.deleteOnePic(faceToDelete)
    }
    await this.faceModel.findByIdAndUpdate(face._id, { isDelete: true })
  }

  async updateByCondition(condition: any, update: any) {
    return await this.faceModel.updateMany(condition, update)
  }
}
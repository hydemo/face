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
import { RedisService } from 'nestjs-redis';
import { IPic } from 'src/common/interface/pic.interface';
import { P2PErrorService } from '../p2pError/p2pError.service';

@Injectable()
export class FaceService {
  constructor(
    @Inject('FaceModelToken') private readonly faceModel: Model<IFace>,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(P2PErrorService) private readonly p2pErrorService: P2PErrorService,
    private readonly redis: RedisService,
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
        deviceFace.faces.push(String(face._id))
        if (face.mode > 1) {
          deviceFace.mode = face.mode
        }
        isAdd = true
      }
    })
    if (!isAdd) {
      const faces = [String(face._id)]
      deviceFaces.push({ deviceId: deviceId, faces, mode: face.mode, face })
    }
    return
  }
  // 根据条件更新
  async updatePic(user: IUser, imgUrl: string) {
    const faces: IFace[] = await this.faceModel.find({ user: user._id, isDelete: false }).populate({ path: 'device', model: 'device' })
    const deviceFaces: any = []
    const client = this.redis.getClient()
    for (let face of faces) {
      if (!face.device.enable) {
        continue
      }
      switch (face.bondType) {
        case 'resident':
          client.hset('pending_resident', `${face.bondToObjectId}`, 1)
          break;
        case 'role':
          client.hset('pending_role', `${face.bondToObjectId}`, 1)
          break;
        case 'school':
          client.hset('pending_school', `${face.bondToObjectId}`, 1)
          break;
        case 'black':
          client.hset('pending_black', `${face.bondToObjectId}`, 1)
          break;
        default:
          break;
      }
      await this.faceModel.findByIdAndUpdate(face._id, { checkResult: 1 })
      this.genFaces(deviceFaces, String(face.device._id), face)
    }
    deviceFaces.map(async deviceFace => {
      const { _id, version } = deviceFace.face.device
      const data = {
        count: 0,
        user: String(user._id),
        imgUrl,
        faces: deviceFace.faces,
        username: user.username,
        mode: deviceFace.mode,
        face: String(deviceFace.face._id),
      }
      const poolExist = await client.hget('p2p_pool', String(_id))
      if (!poolExist) {
        await client.hset('p2p_pool', String(_id), 1)
      }
      await client.hincrby('img', imgUrl, 1)
      if (version === '1.0.0') {
        await client.lpush(`p2p_${_id}`, JSON.stringify({
          ...data,
          LibIndex: deviceFace.face.libIndex,
          FlieIndex: deviceFace.face.flieIndex,
          Pic: deviceFace.face.pic,
          type: 'update-delete',
        }))
        await client.lpush(`p2p_${_id}`, JSON.stringify({ ...data, type: 'update-add' }))
      } else if (version === '1.1.0') {
        await client.lpush(`p2p_${_id}`, JSON.stringify({ ...data, type: 'update' }))
      }

    })
  }

  // 根据条件更新
  async addOnePic(createFace: IFace, device: IDevice, user: IPic, mode: number, imgUrl) {
    if (!device.enable) {
      return
    }
    const data = {
      count: 0,
      type: 'add',
      user: String(user._id),
      imgUrl,
      username: user.username,
      face: createFace._id,
      mode,
      faces: [String(createFace._id)]
    }

    const client = this.redis.getClient()
    const poolExist = await client.hget('p2p_pool', String(device._id))
    if (!poolExist) {
      await client.hset('p2p_pool', String(device._id), 1)
    }
    await client.lpush(`p2p_${device._id}`, JSON.stringify(data))
    await client.hincrby('img', imgUrl, 1)
  }

  // 根据id删除
  async delete(face: IFace) {
    let checkResult = 2
    const faceCount: number = await this.count({ isDelete: false, device: face.device, user: face.user })
    if (faceCount === 1) {
      const faceToDelete: any = await this.faceModel.findById(face._id).populate({ path: 'device', model: 'device' })
      if (!faceToDelete) { return }

      // const exist = await this.cameraUtil.getPersionInfo(faceToDelete.user, faceToDelete.device, faceToDelete.mode)
      // if (exist) {
      const { _id, enable } = faceToDelete.device
      if (!enable) {
        return
      }
      const data = {
        count: 0,
        user: String(faceToDelete.user),
        type: 'delete',
        face: faceToDelete._id,
        LibIndex: faceToDelete.libIndex,
        FlieIndex: faceToDelete.flieIndex,
        Pic: faceToDelete.pic,
        mode: faceToDelete.mode,
        faces: [String(faceToDelete._id)]
      }
      const client = this.redis.getClient()
      const poolExist = await client.hget('p2p_pool', String(_id))
      if (!poolExist) {
        await client.hset('p2p_pool', String(_id), 1)
      }
      await client.lpush(`p2p_${_id}`, JSON.stringify(data))
      checkResult = 1
      // }
    }
    await this.faceModel.findByIdAndUpdate(face._id, { isDelete: true, checkResult })
    return true
  }

  // 根据id删除
  async checkResult(bondToObjectId: string): Promise<number> {
    const isFail = await this.faceModel.findOne({ bondToObjectId, checkResult: 3, isDelete: false })
    const isPending = await this.faceModel.findOne({ bondToObjectId, checkResult: 1, isDelete: false })
    if (isPending) {
      return 4
    }
    if (isFail) {
      return 5
    }
    return 2
  }

  async updateByCondition(condition: any, update: any) {
    return await this.faceModel.updateMany(condition, update)
  }
  async updateById(id: string, update: any) {
    return await this.faceModel.findByIdAndUpdate(id, update)
  }

  async remove(bondToObjectId) {
    await this.faceModel.remove({ bondToObjectId })
  }
  async fix() {
    const p2pErrors = await this.p2pErrorService.find({})
    await Promise.all(p2pErrors.map(async p2pError => {
      await this.faceModel.findByIdAndUpdate(p2pError.face, { checkResult: 1 })
      await this.p2pErrorService.remove(p2pError._id)
    }))
    const client = this.redis.getClient()
    const faces = await this.faceModel
      .find({ checkResult: 1, isDelete: true })
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    await Promise.all(faces.map(async face => {
      const alive = await client.hget('device', face.device.deviceUUID)
      if (!alive || Number(alive) > 4) {
        return
      }
      await this.addOnePic(face, face.device, face.user, face.mode, face.user.faceUrl)
    }))
  }

  async fixDelete() {
    const faces = await this.faceModel
      .find({ checkResult: 1, isDelete: true })
      .lean()
      .exec()
    await Promise.all(faces.map(async face => {
      await this.delete(face)
    }))
  }
  async addFace() {
    const id = '5d85c8c079564a6052c65116'
    const faces = await this.faceModel
      .find({ isDelete: false, device: id, checkResult: 1 })
      .populate({ path: 'user', model: 'user' })
    // .
    // console.log(faces, 'faces')
    const client = this.redis.getClient()
    await Promise.all(faces.map(async face => {
      const data = {
        count: 0,
        type: 'add',
        user: face.user._id,
        imgUrl: face.user.imgUrl,
        username: face.user.username,
        face: face._id,
        mode: face.mode,
        faces: [String(face._id)]
      }
      console.log(data, 'data')
      const poolExist = await client.hget('p2p_pool', id)
      if (!poolExist) {
        await client.hset('p2p_pool', id, 1)
      }
      await client.lpush(`p2p_${id}`, JSON.stringify(data))
    }))

  }

  // async fixBount(bound, type) {
  //   const client = this.redis.getClient()
  //   const ids = ['5d2949ef86020e6ef275e870', '5d294ac086020e6ef275e87c', '5d294ba286020e6ef275e8bb', '5d2ada8217785a2bca9ad1bd', '5d2adad017785a2bca9ad1c1', '5d2d5a6faec31302477e0ef9']
  //   await Promise.all(ids.map(async id => {
  //     const exist = await this.faceModel.findOne({ bondToObjectId: bound._id, device: id, isDelete: false })
  //     if (!exist) {
  //       const faceExist = await this.faceModel.findOne({ user: bound.user, device: id, isDelete: false })
  //       if (faceExist) {
  //         return
  //         // const face: CreateFaceDTO = {
  //         //   device: id,
  //         //   user: bound.user,
  //         //   mode: 2,
  //         //   bondToObjectId: bound._id,
  //         //   bondType: type,
  //         //   zone: bound.zone,
  //         //   checkResult: 2,
  //         //   libIndex: faceExist.libIndex,
  //         //   flieIndex: faceExist.flieIndex,
  //         //   pic: faceExist.pic,
  //         //   // faceUrl: user.faceUrl,
  //         // }
  //         // await this.faceModel.create(face)
  //       } else {
  //         const face: CreateFaceDTO = {
  //           device: id,
  //           user: bound.user,
  //           mode: 2,
  //           bondToObjectId: bound._id,
  //           bondType: type,
  //           zone: bound.zone,
  //           checkResult: 1,
  //           // faceUrl: user.faceUrl,
  //         }
  //         await this.faceModel.create(face)
  //         await client.hset(`sync_${id}`, bound.user, 1)
  //       }
  //     }
  //   }))
  // }

  // async updateByCondition(condition, update) {
  //   await this.faceModel.updateMany(condition, { checkResult: 2 })
  // }


  async disableDevice(device: string) {
    await this.faceModel.updateMany({ device, isDelete: false }, {
      isDelete: true
    })
  }
  async updateFace(face, imgUrl) {
    const client = this.redis.getClient()
    if (!face.device.enable) {
      return
    }
    switch (face.bondType) {
      case 'resident':
        client.hset('pending_resident', `${face.bondToObjectId}`, 1)
        break;
      case 'role':
        client.hset('pending_role', `${face.bondToObjectId}`, 1)
        break;
      case 'school':
        client.hset('pending_school', `${face.bondToObjectId}`, 1)
        break;
      case 'black':
        client.hset('pending_black', `${face.bondToObjectId}`, 1)
        break;
      default:
        break;
    }
    await this.faceModel.findByIdAndUpdate(face._id, { checkResult: 1 })
    const data = {
      count: 0,
      user: String(face.user._id),
      imgUrl,
      faces: [String(face._id)],
      username: face.user.username,
      mode: face.mode,
      face: String(face._id),
      type: 'update',
    }
    const poolExist = await client.hget('p2p_pool', String(face.device._id))
    if (!poolExist) {
      await client.hset('p2p_pool', String(face.device._id), 1)
    }
    await client.lpush(`p2p_${face.device._id}`, JSON.stringify(data))
  }

  async check() {
    const faces = await this.faceModel
      .find({ checkResult: 3, isDelete: true })
      .populate({ path: 'device', model: 'device' })
      .populate({ path: 'user', model: 'user' })
    // if (!face) {
    //   return
    // }
    // if (face.device.version === '1.0.0' && face.pic) {
    //   await this.updatePic(face.user, face.user.faceUrl)
    // }
    // const result = await this.cameraUtil.getPersionInfo(String(face.user._id), face.device.deviceUUID, face.mode)
    // if (!result) {
    //   const faces = await this.faceModel.find({ user: face.user._id, isDelete: false })
    //   console.log(faces)
    // }
    // if (result) {
    // await this.updatePic(face.user, face.user.faceUrl)
    // }
    // console.log(result, 'result')
    await Promise.all(faces.map(async face => await this.delete(face)))
  }
}
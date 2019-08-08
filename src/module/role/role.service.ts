import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IRole } from './interfaces/role.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateRoleByScanDTO, RoleDTO, CreateAdminRole, CreatePoliceRole } from './dto/role.dto';
import { WeixinUtil } from 'src/utils/weixin.util';
import { IUser } from '../users/interfaces/user.interfaces';
import { ZoneService } from '../zone/zone.service';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';
import { IFace } from '../face/interfaces/face.interfaces';
import { FaceService } from '../face/face.service';
import { CameraUtil } from 'src/utils/camera.util';
import { ConfigService } from 'src/config/config.service';
import { CreateFaceDTO } from '../face/dto/face.dto';
import { UserService } from '../users/user.service';
import { IZone } from '../zone/interfaces/zone.interfaces';
import { IArea } from '../area/interfaces/area.interfaces';

interface IReceiver {
  id: string;
  type: string;
}

@Injectable()
export class RoleService {
  constructor(
    @Inject('RoleModelToken') private readonly roleModel: Model<IRole>,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(FaceService) private readonly faceService: FaceService,
  ) { }
  // 创建超级管理员
  async createAdmin(role: CreateAdminRole): Promise<IRole | null> {
    const creatRole = await this.roleModel.create(role);
    return creatRole;
  }

  // 创建警察段
  async createPolice(role: CreatePoliceRole): Promise<IRole | null> {
    const creatRole = await this.roleModel.create(role);
    const devices = await this.deviceService.findByCondition({ area: role.area })
    const user: IUser | null = await this.userService.findById(role.user)
    if (!user) {
      throw new ApiException('用户不存在', ApiErrorCode.NO_EXIST, 406);
    }
    await this.addToDevice(devices, user, creatRole._id)
    return creatRole;
  }

  // 创建数据
  async create(role: RoleDTO): Promise<IRole | null> {
    const user: IUser | null = await this.userService.findById(role.user)
    const zone: IZone | null = await this.zoneService.findById(role.zone)
    if (!user || !zone) {
      throw new ApiException('用户或地区不存在', ApiErrorCode.NO_EXIST, 406);
    }
    const creatRole = await this.roleModel.create(role);
    return creatRole;
  }

  // 创建数据
  async findById(id: string): Promise<IRole | null> {
    return await this.roleModel.findById(id).lean().exec()
  }

  // 创建数据
  async createByScan(role: CreateRoleByScanDTO, reviewer: string): Promise<IRole> {
    const user: IUser = await this.weixinUtil.scan(role.key)
    const exist: number = await this.roleModel.countDocuments({ user: user._id, role: role.role, zone: role.zone, isDelete: false })
    if (exist) {
      throw new ApiException('已有该角色', ApiErrorCode.APPLICATION_EXIST, 406);
    }
    const createRole: RoleDTO = {
      user: user._id,
      zone: role.zone,
      role: role.role,
      description: role.description,
      checkResult: 4,
      reviewer
    }
    const result = await this.roleModel.create(createRole);
    const devices: IDevice[] = await this.deviceService.findByCondition({ zone: role.zone })
    await this.addToDevice(devices, user, result._id)
    return result
  }

  // 添加人员到设备
  async addToDevice(devices: IDevice[], user: IUser, bondToObjectId: string) {
    const img = await this.cameraUtil.getImg(user.faceUrl)
    await Promise.all(devices.map(async device => {
      const faceExist: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id, isDelete: false, checkResult: 2 })
      if (faceExist) {
        const face = {
          device: device._id,
          user: user._id,
          mode: 2,
          libIndex: faceExist.libIndex,
          flieIndex: faceExist.flieIndex,
          pic: faceExist.pic,
          bondToObjectId,
          bondType: 'role',
          zone: device.zone,
          checkResult: 2,
          faceUrl: user.faceUrl,
        }
        return await this.faceService.create(face);
      } else {
        const face: CreateFaceDTO = {
          device: device._id,
          user: user._id,
          mode: 2,
          checkResult: 1,
          bondToObjectId,
          bondType: 'role',
          zone: device.zone,
          // faceUrl: user.faceUrl
        }
        return await this.faceService.addOnePic(face, device, user, this.config.whiteMode, img)
      }
    }))
    const checkResult = await this.faceService.checkResult(bondToObjectId)
    await this.roleModel.findByIdAndUpdate(bondToObjectId, { checkResult })
  }

  // 删除数据
  async delete(id: string, userId: string): Promise<IRole | null> {
    const role: IRole | null = await this.roleModel.findById(id)
    if (!role) {
      return null
    }
    // if (role.role === 1) {
    //   throw new ApiException('物业无法删除', ApiErrorCode.NO_PERMISSION, 403);
    // }
    const exist = await this.roleModel.findOne({ zone: role.zone, user: userId, isDelete: false, role: 1 })
    if (!exist) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: id, isDelete: false })
    await Promise.all(faces.map(async face => {
      return await this.faceService.delete(face)
    }))
    const checkResult: number = await this.faceService.checkResult(id)
    return await this.roleModel.findByIdAndUpdate(id, { isDelete: true, checkResult });
  }

  // 删除数据
  async deletePolice(id: string, userId: string): Promise<IRole | null> {
    const role: IRole | null = await this.roleModel.findById(id)
    if (!role) {
      return null
    }
    // if (role.role === 1) {
    //   throw new ApiException('物业无法删除', ApiErrorCode.NO_PERMISSION, 403);
    // }
    const exist = await this.roleModel.findOne({ user: userId, isDelete: false, role: 4 })
    if (!exist || String(role.area) !== String(exist.area)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: id, isDelete: false })
    await Promise.all(faces.map(async face => {
      return await this.faceService.delete(face)
    }))
    const checkResult: number = await this.faceService.checkResult(id)
    return await this.roleModel.findByIdAndUpdate(id, { isDelete: true, checkResult });
  }

  // 删除物业
  async deleteManagement(id: string): Promise<IRole | null> {
    const role: IRole | null = await this.roleModel.findById(id)
    if (role && role.role === 1) {
      return await this.roleModel.findByIdAndUpdate(id, { isDelete: true })
    }
    return null
  }

  // 查询全部数据
  async findByManagement(pagination: Pagination, user: string) {
    if (!pagination.zone) {
      return { list: [], total: 0 }
    }
    const zone = pagination.zone;
    const canActive = await this.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = { isDelete: false, zone, role: { $in: [1, 2, 3] } }
    const list: IRole[] = await this.roleModel
      .find(condition)
      .sort({ role: 1 })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .populate({ path: 'user', model: 'user', select: 'username faceUrl phone' })
      .populate({ path: 'reviewer', model: 'user', select: 'username' })
      .lean()
      .exec()
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  // 创建数据
  async createPoliceByScan(key: string, reviewer: string): Promise<IRole> {
    const user: IUser = await this.weixinUtil.scan(key)
    const userRole: IRole | null = await this.roleModel.findOne({ isDelete: false, role: 4, user: reviewer })
    if (!userRole) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const exist: number = await this.roleModel.countDocuments({ user: user._id, role: 4, area: userRole.area, isDelete: false })
    if (exist) {
      throw new ApiException('已在该片区', ApiErrorCode.APPLICATION_EXIST, 406);
    }
    const createRole: CreatePoliceRole = {
      user: user._id,
      role: 4,
      checkResult: 4,
      reviewer,
      area: userRole.area
    }
    const result = await this.roleModel.create(createRole);
    const devices = await this.deviceService.findByCondition({ area: userRole.area })
    await this.addToDevice(devices, user, result._id)
    return result
  }


  // 查询全部数据
  async polices(pagination: Pagination, user: string) {
    const userRole: IRole | null = await this.roleModel.findOne({ isDelete: false, role: 4, user })
    if (!userRole) {
      return { list: [], total: 0 }
    }
    const condition = { isDelete: false, area: userRole.area, role: 4 }
    const list: IRole[] = await this.roleModel
      .find(condition)
      .sort({ role: 1 })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .populate({ path: 'user', model: 'user', select: 'username faceUrl phone' })
      .populate({ path: 'reviewer', model: 'user', select: 'username' })
      .lean()
      .exec()
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  // 查询全部数据
  async getTail(skip: number, zone: string, user: string): Promise<IRole | null> {
    const canActive = await this.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = { isDelete: false, zone, role: { $lt: 4 } }
    const roles: IRole[] = await this.roleModel
      .find(condition)
      .sort({ role: 1 })
      .limit(1)
      .skip(skip - 1)
      .populate({ path: 'user', model: 'user', select: 'username faceUrl phone' })
      .lean()
      .exec()
    if (roles.length) {
      return roles[0]
    } else {
      return null
    }

  }

  // 查询全部数据
  async findManagements(pagination: Pagination): Promise<IList<IRole>> {
    const condition = { role: 1 }
    const list = await this.roleModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  // 查询全部数据
  async getPoliceArea(user: string): Promise<IRole | null> {
    return await this.roleModel
      .findOne({ user, isDelete: false, role: 4 })
      .populate({ path: 'area', model: 'area' })
  }
  // 查询全部数据
  async myRoles(userId: string) {
    const cond = { user: userId, isDelete: false }
    let owner = [];
    let guard = [];
    let management = [];
    let worker = [];
    let rent = [];
    let isAdmin = false;
    const roles: any = await this.roleModel.aggregate([
      { $match: cond },
      { $group: { _id: '$role', zones: { $push: '$zone' } } },
      { $lookup: { from: 'zone', localField: 'zones', foreignField: '_id', as: 'zones' } },
    ])
    if (!roles.length) {
      return { owner, guard, management, worker, rent, isAdmin }
    }
    await Promise.all(roles.map(async role => {
      switch (role._id) {
        case 0: isAdmin = true;
          break;
        case 1: {
          management = await Promise.all(role.zones.map(async zone => {
            const total = await this.zoneService.countByCondition({
              zoneId: zone._id,
              zoneLayer: 2
            })
            const ownerCount = await this.zoneService.countByCondition({
              zoneId: zone._id,
              zoneLayer: 2,
              owner: { $exists: 1 }
            })
            const workerCount = await this.roleModel.countDocuments({
              zone: zone._id,
              isDelete: false,
              $and: [{ role: { $lt: 4 } }, { role: { $gt: 0 } }]
            })
            return { ...zone, total, ownerCount, workerCount }
          }))
        };
          break;
        case 2: worker = role.zones || [];
          break;
        case 3: guard = role.zones || [];
          break;
        // case 4: {
        //   owner = await Promise.all(role.zones.map(async zone => {
        //     const rentCount = await this.roleModel.countDocuments({ zone: zone._id, role: 5, isDelete: false })
        //     return { ...zone, isRent: rentCount > 0 }
        //   }))
        // };
        //   break;
        // case 5: rent = role.zones || [];
        //   break;
        default:
          break;
      }
    }));
    return { guard, management, worker, isAdmin }
  }

  async checkRoles(condition: any) {
    return await this.roleModel.countDocuments(condition);
  }

  async findByZone(pagination: Pagination, zone: string) {
    const condition = { role: 1, zone, isDelete: false }
    const list = await this.roleModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'user', model: 'user', select: '-password' })
      .lean()
      .exec();
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  async findByCondition(condition: any) {
    return await this.roleModel.find(condition).populate({ path: 'zone', model: 'zone' }).lean().exec()
  }

  async findOneByCondition(condition: any) {
    return await this.roleModel.findOne(condition).lean().exec()
  }

  async findOneAndDelete(condition: any) {
    return await this.roleModel.findOneAndUpdate(condition, { isDelete: true })
  }

  // 根据id修改
  async updateById(id: string, update: any): Promise<IRole | null> {
    return await this.roleModel.findByIdAndUpdate(id, update)
  }

  // 根据id修改
  async blackReceivers(device: IDevice): Promise<IReceiver[]> {
    const managements: IRole[] = await this.roleModel.find({ zone: device.zone, isDelete: false, role: 1 })
    const polices: IRole[] = await this.roleModel.find({ role: 4, isDelete: false, area: device.area })
    const receivers: IReceiver[] = []
    managements.map(management => {
      receivers.push({ id: management.user, type: 'black' })
    })
    polices.map(police => {
      receivers.push({ id: police.user, type: 'black' })
    })
    return receivers
  }

  async fix() {

    const roles: IRole[] = await this.roleModel.find({ role: { $in: [4, 5] } })
    const rols: IRole[] = await this.roleModel.find({ role: { $in: [1, 2, 3] }, isDelete: false })
    await Promise.all(roles.map(async role => {
      await this.faceService.remove(role._id)
      await this.roleModel.findByIdAndRemove(role._id)
    }))

    await Promise.all(rols.map(async rol => {
      // const count = await this.faceService.count({ bondToObjectId: rol._id, isDelete: false })
      // if (count < 6) {
      //   console.log(rol.user, count)
      // }
      await this.faceService.fixBount(rol, 'role')


    }))
  }
}
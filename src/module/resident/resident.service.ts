import { Model } from 'mongoose';
import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';
import { IResident } from './interfaces/resident.interfaces';
import { CreateResidentDTO, ResidentDTO, CreateFamilyDTO, CreateFamilyByScanDTO, CreateVisitorByScanDTO, AgreeFamilyDTO, UpdateFamilyDTO, AgreeVisitorDTO, CreateVisitorByOwnerDTO } from './dto/resident.dto';
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
import { CreateUserDTO } from '../users/dto/users.dto';
import { WeixinUtil } from 'src/utils/weixin.util';
import { IFace } from '../face/interfaces/face.interfaces';
import { RoleService } from '../role/role.service';
import { RoleDTO } from '../role/dto/role.dto';

@Injectable()
export class ResidentService {
  constructor(
    @Inject('ResidentModelToken') private readonly residentModel: Model<IResident>,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(FaceService) private readonly faceService: FaceService,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
    @Inject(RoleService) private readonly roleService: RoleService,
  ) { }

  // 申请重复确认
  async residentExist(address: string, user: string) {
    const exist = await this.residentModel.findOne({ address, user, type: { $ne: 'visitor' }, isDelete: false })
    if (exist) {
      throw new ApiException('已经在该房屋', ApiErrorCode.APPLICATION_EXIST, 406);
    }
  }
  // 业主存在确认
  async getOwner(address: string) {
    return await this.residentModel.findOne({ address, isDelete: false, checkResult: 2 })
  }
  // 是否是业主本人
  async isOwner(address: string, user: string) {
    const owner: IResident | null = await this.residentModel.findOne({ user, address, isDelete: false, checkResult: 2 })
    if (!owner) {
      throw new ApiException('无权限操作该房屋', ApiErrorCode.NO_PERMISSION, 403);
    }
  }
  // 业主申请
  async ownerApplication(createResidentDTO: CreateResidentDTO, user: IUser): Promise<IResident> {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    await this.residentExist(createResidentDTO.address, user._id)
    const owner: IResident | null = await this.getOwner(createResidentDTO.address)
    if (owner) {
      throw new ApiException('该房屋已有业主', ApiErrorCode.NO_PERMISSION, 403);
    }
    const zone: IZone = await this.zoneService.findById(createResidentDTO.address)
    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: createResidentDTO.address,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: false,
      isPush: true,
      type: 'owner',
    }
    const creatResident = await this.residentModel.create(resident);
    return creatResident;
  }

  // 申请列表
  async myApplications(pagination: Pagination, reviewer: string): Promise<IList<IResident>> {
    const condition: any = { reviewer, isDelete: false, checkResult: 1 };
    const list: IResident[] = await this.residentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ applicationTime: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.residentModel.countDocuments(condition);
    return { list, total };
  }

  // 常住人申请
  async familyApplication(createResidentDTO: CreateResidentDTO, user: IUser): Promise<IResident> {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const owner: IResident | null = await this.getOwner(createResidentDTO.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.residentExist(createResidentDTO.address, user._id)
    const zone: IZone = await this.zoneService.findById(createResidentDTO.address)
    const resident: ResidentDTO = {
      address: createResidentDTO.address,
      zone: zone.zoneId,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'family',
      reviewer: owner.user,
    }
    const creatResident = await this.residentModel.create(resident);
    return creatResident;
  }
  // 访客申请
  async visitorApplication(visitor: CreateResidentDTO, user: IUser): Promise<IResident> {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const owner: IResident | null = await this.getOwner(visitor.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.residentExist(visitor.address, user._id)
    const zone: IZone = await this.zoneService.findById(visitor.address)
    const resident: ResidentDTO = {
      address: visitor.address,
      zone: zone.zoneId,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: true,
      type: 'visitor',
      reviewer: owner.user,
    }
    const creatResident = await this.residentModel.create(resident);
    return creatResident;
  }

  // 业主添加常住人
  async addFamilyByOwner(family: CreateFamilyDTO, userId: string, ip: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isOwner(zone._id, userId)
    const createUserDto: CreateUserDTO = {
      ...family.user,
      registerIp: ip,
      registerTime: new Date(),
      isVerify: true,
      isPhoneVerify: false,
    }
    const createUser: IUser = await this.userService.create(createUserDto)
    return await this.addFamily(family.isMonitor, false, createUser, zone, userId)
  }

  async addFamilyByScan(family: CreateFamilyByScanDTO, userId: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isOwner(zone._id, userId)
    const user = await this.weixinUtil.scan(family.key)
    return await this.addFamily(family.isMonitor, false, user, zone, userId)
  }

  async scanToVisitor(visitor: CreateVisitorByScanDTO, user: IUser) {
    const zone = await this.weixinUtil.scan(visitor.key)
    const expireTime: Date = moment().add(1, 'd').toDate()

    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: zone._id,
      user: user._id,
      checkResult: 2,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'visitor',
      reviewer: zone.reviewer,
      expireTime,
      addTime: new Date(),
      checkTime: new Date(),
    }
    const createResident: IResident = await this.residentModel.create(resident);
    await this.addToDevice(zone, user, createResident._id, expireTime);
    return
  }

  async addVisitorByScan(visitor: CreateVisitorByOwnerDTO, userId: string) {
    const zone: IZone = await this.zoneService.findById(visitor.address)
    const expireTime = moment().add(visitor.expireTime, 'd').toDate()
    await this.isOwner(zone._id, userId)
    const user = await this.weixinUtil.scan(visitor.key)
    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: zone._id,
      user: user._id,
      checkResult: 2,
      isMonitor: true,
      applicationTime: new Date(),
      addTime: new Date(),
      type: 'visitor',
      checkTime: new Date(),
      expireTime,
      reviewer: userId,
    }
    const creatResident = await this.residentModel.create(resident);
    await this.addToDevice(zone, user, creatResident._id, expireTime);
    return
  }

  async addFamily(isMonitor: boolean, isPush: boolean, user: IUser, zone: IZone, owner: string): Promise<IResident> {
    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: zone._id,
      user: user._id,
      checkResult: 2,
      applicationTime: new Date(),
      isMonitor,
      isPush,
      addTime: new Date(),
      type: 'family',
      checkTime: new Date(),
      reviewer: owner,
    }
    const creatResident = await this.residentModel.create(resident);
    await this.addToDevice(zone, user, creatResident._id)
    return creatResident;
  }

  // 添加人员到设备
  async addToDevice(zone: IZone, user: IUser, resident: string, expire?: Date) {
    const zoneIds = [...zone.ancestor, zone._id]
    const devices: IDevice[] = await this.deviceService.findByCondition({ position: { $in: zoneIds } })
    console.log(devices, 'dd')
    await Promise.all(devices.map(async device => {
      const result: any = await this.cameraUtil.addOnePic(device, user, 2)
      if (!result) {
        throw new ApiException('上传失败', ApiErrorCode.INTERNAL_ERROR, 500);
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: user._id,
        mode: 2,
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.pic,
        resident,
        zone: zone.zoneId,
      }
      if (expire) {
        face.expire = expire;
      }
      await this.faceService.create(face);
    }))
  }
  // 业主审核通过
  async agreeOwner(id: string): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    const owner: IResident | null = await this.getOwner(resident.address._id)
    if (owner) {
      throw new ApiException('该房屋已有业主', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.addToDevice(resident.address, resident.user, id)
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    const role: RoleDTO = {
      role: 4,
      description: '业主',
      user: resident.user._id,
      zone: resident.address._id,
    }
    await this.roleService.create(role)
    return true;
  }

  // 业主审核不通过
  async rejectOwner(id: string): Promise<boolean> {
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
    })
    return true;
  }

  // 接受常住人申请
  async agreeFamily(id: string, userId: string, agree: AgreeFamilyDTO): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'zone', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    await this.isOwner(resident.address._id, userId)
    await this.addToDevice(resident.address, resident.user, id)
    await this.residentModel.findByIdAndUpdate(id, {
      isPush: agree.isMonitor,
      isMonitor: agree.isPush,
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    return true;
  }

  // 接受常住人申请
  async agreeVisitor(id: string, userId: string, expire: number): Promise<boolean> {
    const expireTime = moment().add(expire, 'd').toDate()
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    await this.isOwner(resident.address._id, userId)
    await this.addToDevice(resident.address, resident.user, id, expireTime)
    await this.residentModel.findByIdAndUpdate(id, {
      expireTime,
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    return true;
  }

  // 拒绝常住人申请
  async rejectApplication(id: string, userId: string): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .lean()
      .exec()
    await this.isOwner(resident.address, userId)
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
    })
    return true;
  }

  // 获取业主身份的所有房屋
  async getApplications(pagination: Pagination, userId: string, type: string): Promise<IList<IResident>> {
    const condition: any = { type, isDelete: false, user: userId };
    const list: IResident[] = await this.residentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.residentModel.countDocuments(condition);
    return { list, total };
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
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.residentModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id删除
  async deleteById(resident: string): Promise<IResident> {
    const faces: IFace[] = await this.faceService.findByCondition({ resident })
    await Promise.all(faces.map(async face => {
      await this.cameraUtil.deleteOnePic(face);
    }))
    return await this.residentModel.findByIdAndUpdate(resident, { isDelete: true }).lean().exec();
  }

  // 根据id修改
  async updateFamilyById(id: string, update: UpdateFamilyDTO) {
    const resident: IResident | null = await this.residentModel
      .findById(id)
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (resident.type !== 'family') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    if (!resident.user.isPhoneVerify) {
      await this.residentModel.findByIdAndUpdate(id, { isMonitor: update.isMonitor })
      const user: IUser | null = await this.userService.updateById(resident.user._id, { ...update.user })
      if (!user) {
        throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
      }
      if (resident.user.faceUrl) {
        await this.faceService.updatePic({ resident: id }, user)
      }

    }
    return await this.residentModel.findByIdAndUpdate(id, { isMonitor: update.isMonitor, isPush: update.isPush })
  }

  async updateVisitorById(id: string, update: AgreeVisitorDTO) {
    const resident: IResident = await this.findById(id)
    const expireTime = moment(resident.expireTime).add(update.expireTime, 'd')
    if (resident.type !== 'visitor') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    if (moment().diff(expireTime, 'd', true) > 7) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.faceService.updateByCondition({ resident: resident._id }, { expireTime })
    return await this.residentModel.findByIdAndUpdate(id, { expireTime })
  }

  // 常住人列表
  async families(userId: string): Promise<any> {
    const condition: any = { type: 'owner', isDelete: false, user: userId, checkResult: 2 };
    const owners: IResident[] = await this.residentModel
      .find(condition)
      .sort({ createdAt: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec();
    return await Promise.all(owners.map(async owner => {
      const address = owner.address;
      const users = await this.residentModel
        .find({ address: address._id, isDelete: false, checkResult: 2, type: 'family' })
        .populate({ path: 'user', model: 'user', select: '-password' })
        .lean()
        .exec()
      return { address, users }
    }))
  }

  // 访客列表
  async visitors(userId: string): Promise<any> {
    const condition: any = { type: 'owner', isDelete: false, user: userId, checkResult: 2 };
    const owners: IResident[] = await this.residentModel
      .find(condition)
      .sort({ createdAt: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec();
    return await Promise.all(owners.map(async owner => {
      const address = owner.address;
      const users = await this.residentModel
        .find({ address: address._id, isDelete: false, checkResult: 2, type: 'visitor' })
        .populate({ path: 'user', model: 'user', select: '-password' })
        .lean()
        .exec()
      return { address, users }
    }))
  }

  // 根据用户id查询住客列表
  async findByCondition(condition: any): Promise<IResident[]> {
    return await this.residentModel.find(condition)
  }
}
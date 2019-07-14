import { Model } from 'mongoose';
import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';
import { IResident } from './interfaces/resident.interfaces';
import {
  CreateResidentDTO,
  ResidentDTO,
  CreateFamilyDTO,
  CreateFamilyByScanDTO,
  CreateVisitorByScanDTO,
  AgreeFamilyDTO,
  UpdateFamilyDTO,
  AgreeVisitorDTO,
  CreateVisitorByOwnerDTO
} from './dto/resident.dto';
import * as uuid from 'uuid/v4';
import { RedisService } from 'nestjs-redis';
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
import { ConfigService } from 'src/config/config.service';
import { ApplicationDTO } from 'src/common/dto/Message.dto';
import { PreownerService } from '../preowner/preowner.service';
import { ZOCUtil } from 'src/utils/zoc.util';
import { IZoneProfile } from '../zone/interfaces/zonePrifile.interface';

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
    @Inject(ZOCUtil) private readonly zocUtil: ZOCUtil,
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PreownerService) private readonly preownerService: PreownerService,
    private readonly redis: RedisService,
  ) { }

  // 申请重复确认
  async residentExist(address: string, user: string) {
    const exist = await this.residentModel.findOne({
      address,
      user,
      isDelete: false,
      checkResult: { $lt: 3 },
      isDisable: false,
    })
    if (exist) {
      throw new ApiException('已在或已申请该房屋', ApiErrorCode.APPLICATION_EXIST, 406);
    }
  }
  // 业主存在确认
  async getOwner(address: string) {
    return await this.residentModel
      .findOne({ address, isDelete: false, isDisable: false, checkResult: 2, type: 'owner' })
      .populate({ path: 'user', model: 'user' })
      .exec()
  }
  // 是否是业主本人
  async isOwner(address: string, user: string) {
    const owner: IResident | null = await this.residentModel.findOne({ user, address, isDelete: false, isDisable: false, checkResult: 2 })
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
    const ownerCheck = await this.preownerService.ownerCheck(user.cardNumber, zone.zoneId, zone.houseNumber)
    if (ownerCheck) {
      await this.agreeOwner(creatResident._id, user._id)
    }
    return creatResident;
  }

  // 申请列表
  async myApplications(pagination: Pagination, reviewer: string): Promise<IList<IResident>> {
    const condition: any = { reviewer, isDelete: false, checkResult: 1, type: { $ne: 'owner' } };
    const list: IResident[] = await this.residentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ applicationTime: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.residentModel.countDocuments(condition);
    return { list, total };
  }

  // 申请列表
  async ownerReviews(pagination: Pagination, user: string, checkResult: string) {
    if (!pagination.zone) {
      return { list: [], total: 0 }
    }
    const zone = pagination.zone;
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = { isDelete: false, type: 'owner', zone, checkResult, isRent: { $exists: false } }
    const list: IResident[] = await this.residentModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ checkResult: 1, applicationTime: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .populate({ path: 'user', model: 'user' })
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
      reviewer: owner.user._id,
    }
    const creatResident = await this.residentModel.create(resident);
    const message: ApplicationDTO = {
      first: {
        value: `您收到一条${zone.houseNumber}的家人申请`,
        color: "#173177"
      },
      keyword1: {
        value: user.username,
        color: "#173177"
      },
      keyword2: {
        value: user.phone,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: zone.houseNumber,
        color: "#173177"
      },
      remark: {
        value: '请前往小门神智慧社区平台进行审核处理',
        color: "#173177"
      },
    }
    this.weixinUtil.sendApplicationMessage(owner.user.openId, message)
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
      reviewer: owner.user._id,
    }
    const creatResident = await this.residentModel.create(resident);
    const message: ApplicationDTO = {
      first: {
        value: `您收到一条${zone.houseNumber}的家人申请`,
        color: "#173177"
      },
      keyword1: {
        value: user.username,
        color: "#173177"
      },
      keyword2: {
        value: user.phone,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: zone.houseNumber,
        color: "#173177"
      },
      remark: {
        value: '请前往小门神智慧社区平台进行审核处理',
        color: "#173177"
      },
    }
    this.weixinUtil.sendApplicationMessage(owner.user.openId, message)
    return creatResident;
  }

  // 业主添加常住人
  async addFamilyByOwner(family: CreateFamilyDTO, userId: string, ip: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isOwner(zone._id, userId)
    let createUser = await this.userService.findOneByCondition({ cardNumber: family.user.cardNumber })
    if (!createUser) {
      const createUserDto: CreateUserDTO = {
        ...family.user,
        registerIp: ip,
        registerTime: new Date(),
        isVerify: true,
        isPhoneVerify: false,
      }
      createUser = await this.userService.create(createUserDto)
    }
    return await this.addFamily(family.isMonitor, false, createUser, zone, userId)
  }

  async addFamilyByScan(family: CreateFamilyByScanDTO, userId: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isOwner(zone._id, userId)
    const user = await this.weixinUtil.scan(family.key)
    if (user.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    await this.residentExist(family.address, user._id)
    return await this.addFamily(family.isMonitor, family.isPush, user, zone, userId)
  }

  async scanToVisitor(visitor: CreateVisitorByScanDTO, user: IUser) {
    const key = await this.weixinUtil.scan(visitor.key)
    if (key.type !== 'zone') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    const zone: IZone = await this.zoneService.findById(key._id)
    const exist: IResident | null = await this.residentModel.findOne({
      user: user._id,
      zone: zone._id,
      isDelete: false,
      isDisable: false,
      checkResult: { $lt: 3 },
    })
    if (exist) {
      throw new ApiException('已在或已申请该小区', ApiErrorCode.APPLICATION_EXIST, 406);
    }
    const expireTime: Date = moment().startOf('d').add(1, 'd').toDate()

    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: zone._id,
      user: user._id,
      checkResult: 2,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'visitor',
      reviewer: key.reviewer,
      expireTime,
      addTime: new Date(),
      checkTime: new Date(),
    }
    const createResident: IResident = await this.residentModel.create(resident);
    await this.addToDevice(zone, user, createResident._id, expireTime);
    return
  }

  async addVisitor(address: IZone, user: IUser, reviewer: string, expireTime: Date) {
    await this.residentExist(address._id, user._id)
    const resident: ResidentDTO = {
      zone: address.zoneId,
      address: address._id,
      user: user._id,
      checkResult: 2,
      isMonitor: true,
      applicationTime: new Date(),
      addTime: new Date(),
      type: 'visitor',
      checkTime: new Date(),
      expireTime,
      reviewer,
    }
    const creatResident = await this.residentModel.create(resident);
    await this.addToDevice(address, user, creatResident._id, expireTime);
    return
  }

  async addVisitorByScan(visitor: CreateVisitorByOwnerDTO, userId: string) {
    const zone: IZone = await this.zoneService.findById(visitor.address)
    await this.isOwner(zone._id, userId)
    const expireTime = moment().startOf('d').add(visitor.expireTime, 'd').toDate()
    const user = await this.weixinUtil.scan(visitor.key)
    if (user.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.addVisitor(zone, user, userId, expireTime)
  }

  async addVisitorByLink(key: string, user: IUser) {
    const link: any = await this.weixinUtil.scan(key);
    const { address, type, reviewer } = link
    const zone: IZone = await this.zoneService.findById(address)
    const expireTime = moment().startOf('d').add(1, 'd').toDate()
    if (type !== 'visitor') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.addVisitor(zone, user, reviewer, expireTime)
  }

  async getVisitorQrCode(address: string, user: IUser) {
    const zone: IZone = await this.zoneService.findById(address)
    await this.isOwner(zone._id, user._id)
    const key = uuid()
    const client = this.redis.getClient()
    const value = {
      name: zone.houseNumber,
      address: zone._id,
      type: 'visitor',
      username: user.username,
      reviewer: user._id,
    };
    await client.set(key, JSON.stringify(value), 'EX', 60 * 60);
    return key
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
  // 上报常住人至智能感知平台
  async uploadToZoc(userId: string, zoneId: string, profile: IZoneProfile, deviceIds: string[]) {
    const userToZOC = await this.userService.updateById(userId, {})
    const zoneToZOC = await this.zoneService.findById(zoneId)
    const data = await this.zocUtil.genResidentData(profile, zoneToZOC.detail, userToZOC, deviceIds)
    const time = moment().format('YYYYMMDDHHmmss');
    const zip = await this.zocUtil.genZip()
    await this.zocUtil.genResident(zip, time, [data])
    await this.zocUtil.upload(zip, time)
  }

  // 添加人员到设备
  async addToDevice(zone: IZone, user: IUser, resident: string, expire?: Date) {
    const zoneIds = [...zone.ancestor, zone._id]
    const devices: IDevice[] = await this.deviceService.findByCondition({ position: { $in: zoneIds } })
    // if (!expire) {
    //   const deviceIds = devices.map(device => String(device.deviceId))
    //   this.uploadToZoc(user._id, zone.zoneId, zone.profile, deviceIds)
    // }
    const img = await this.cameraUtil.getImg(user.faceUrl)
    Promise.all(devices.map(async device => {
      const faceCheck: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id, bondToObjectId: resident, })
      if (faceCheck) {
        return
      }
      const faceExist: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id })
      let result: any;
      if (!faceExist) {
        result = await this.cameraUtil.addOnePic(device, user, this.config.whiteMode, img)
        if (!result) {
          throw new ApiException('上传失败', ApiErrorCode.INTERNAL_ERROR, 500);
        }
      } else {
        result = {
          LibIndex: faceExist.libIndex,
          FlieIndex: faceExist.flieIndex,
          Pic: faceExist.pic,
        }
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: user._id,
        mode: 2,
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.Pic,
        bondToObjectId: resident,
        zone: zone.zoneId,
      }
      if (expire) {
        face.expire = expire;
      }
      await this.faceService.create(face);
    }))
  }

  // 物业通过业主审核
  async agreeOwnerByManagement(id: string, user: string) {
    const resident: IResident = await this.findById(id)
    if (resident.type !== 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const canActive = await this.roleService.checkRoles({ user, isDelete: false, role: 1, zone: resident.zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.agreeOwner(id, user);
  }

  // 物业通过业主审核
  async rejectOwnerByManagement(id: string, user: string) {
    const resident: IResident = await this.findById(id)
    if (resident.type !== 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const canActive = await this.roleService.checkRoles({ user, isDelete: false, role: 1, zone: resident.zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    return await this.rejectOwner(id, user);
  }

  // 业主审核通过
  async agreeOwner(id: string, reviewer: string): Promise<boolean> {
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
      reviewer,
    })
    const role: RoleDTO = {
      role: 4,
      description: '业主',
      user: resident.user._id,
      zone: resident.address._id,
    }
    await this.zoneService.updateOwner(resident.address._id, resident.user._id)
    await this.roleService.create(role)
    const otherApplications: IResident[] = await this.residentModel.find({
      checkResult: 1,
      isDelete: false,
      isDisable: false,
      type: 'owner',
      address: resident.address,
    })
    await Promise.all(otherApplications.map(async application => await this.rejectOwner(application.id, reviewer)))
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber}业主申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核通过',
        color: "#173177"
      },
      keyword2: {
        value: '物业',
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: '无',
        color: "#173177"
      },
      remark: {
        value: '登录公众号可以邀请您的家人和访客，邀请完可刷脸进出小区',
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(resident.user.openId, message)
    return true;
  }

  // 业主审核不通过
  async rejectOwner(id: string, reviewer: string): Promise<boolean> {
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
      reviewer,
    })
    return true;
  }

  // 接受常住人申请
  async agreeFamily(id: string, user: IUser, agree: AgreeFamilyDTO): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (resident.type !== 'family') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(resident.address._id, user._id)
    await this.addToDevice(resident.address, resident.user, id)
    await this.residentModel.findByIdAndUpdate(id, {
      isPush: agree.isMonitor,
      isMonitor: agree.isPush,
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber}家人申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核通过',
        color: "#173177"
      },
      keyword2: {
        value: `${user.username}`,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: '无',
        color: "#173177"
      },
      remark: {
        value: '您现在可以刷脸进出小区',
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(resident.user.openId, message)
    return true;
  }

  // 接受常住人申请
  async agree(id: string, userId: string, agree: AgreeFamilyDTO): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (resident.type !== 'family') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
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

  // 接受常访客申请
  async agreeVisitor(id: string, user: IUser, expire: number): Promise<boolean> {
    const expireTime = moment().startOf('d').add(expire, 'd').toDate()
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()

    if (resident.type !== 'visitor') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(resident.address._id, user._id)
    await this.addToDevice(resident.address, resident.user, id, expireTime)
    await this.residentModel.findByIdAndUpdate(id, {
      expireTime,
      checkResult: 2,
      addTime: new Date(),
      checkTime: new Date(),
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber}访客申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核通过',
        color: "#173177"
      },
      keyword2: {
        value: `${user.username} `,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: '无',
        color: "#173177"
      },
      remark: {
        value: `您现在可以刷脸进出小区，有效期至${moment(expireTime).format('YYYY:MM:DD HH:mm:ss')} `,
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(resident.user.openId, message)
    return true;
  }

  // 拒绝常住人申请
  async rejectApplication(id: string, user: IUser): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (resident.type === 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(resident.address, user._id)
    await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber} ${resident.tpye === 'family' ? '家人人' : '访客'} 申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核通过',
        color: "#173177"
      },
      keyword2: {
        value: `${user.username} `,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: '无',
        color: "#173177"
      },
      remark: {
        value: `请核对提交信息是否准确，确定无误后可再发出申请`,
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(resident.user.openId, message)
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
  async deleteById(resident: string, user: string): Promise<IResident | null> {
    const data: IResident | null = await this.residentModel.findById(resident).lean()
    console.log(data, 'data')
    if (!data) {
      return null
    }
    if (String(data.reviewer) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: resident, isDelete: false })
    console.log(faces, 'faces')
    await Promise.all(faces.map(async face => {
      return await this.faceService.delete(face)
    }))
    return await this.residentModel.findByIdAndUpdate(resident, { isDelete: true }).lean().exec();
  }

  // 根据id修改
  async updateFamilyById(id: string, update: UpdateFamilyDTO, user: string) {
    const resident: IResident | null = await this.residentModel
      .findById(id)
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (String(resident.reviewer) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
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
        await this.faceService.updatePic({ bondToObjectId: id, isDelete: false }, user, resident.user.faceUrl)
      }

    }
    return await this.residentModel.findByIdAndUpdate(id, { isMonitor: update.isMonitor, isPush: update.isPush })
  }

  async updateVisitorById(id: string, update: AgreeVisitorDTO, user: string) {
    const resident: IResident | null = await this.findById(id)
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (String(resident.reviewer) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    if (resident.type !== 'visitor') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    if (update.expireTime > 7) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const expireTime = moment().startOf('d').add(update.expireTime, 'd')
    await this.faceService.updateByCondition({ bondToObjectId: resident._id, isDelete: false }, { expireTime })
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
        .find({ address: address._id, isDelete: false, checkResult: 2, type: 'family', reviewer: owner.user })
        .populate({ path: 'user', model: 'user', select: '-password' })
        .lean()
        .exec()
      return { address, users, isRent: owner.isDisable, isOwner: String(userId) === String(address.owner) }
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
        .find({ address: address._id, isDelete: false, checkResult: 2, type: 'visitor', reviewer: owner.user })
        .populate({ path: 'user', model: 'user', select: '-password' })
        .lean()
        .exec()
      return { address, users, isRent: owner.isDisable, isOwner: String(userId) === String(address.owner) }
    }))
  }

  // 出租
  async rent(tenant: IUser, address: IZone) {
    const residents: IResident[] = await this.residentModel.find({ address: address._id, isDelete: false })
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'visitor') {
        const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: resident._id, isDelete: false })
        faces.map(face => this.faceService.delete(face._id))
        return await this.residentModel.findByIdAndUpdate(resident._id, { isDelete: true })
      }
      return await this.residentModel.findByIdAndUpdate(resident._id, { isDisable: true })
    }))
    const createResident: ResidentDTO = {
      zone: address.zoneId,
      address: address._id,
      user: tenant._id,
      checkResult: 2,
      applicationTime: new Date(),
      isMonitor: false,
      isPush: true,
      type: 'owner',
      addTime: new Date(),
      checkTime: new Date(),
      isRent: true,
      reviewer: address.owner,
    }
    const resident: IResident = await this.residentModel.create(createResident)
    const role: RoleDTO = {
      role: 5,
      description: '租客',
      user: resident.user._id,
      zone: resident.address._id,
    }
    await this.roleService.create(role)
    return await this.addToDevice(address, tenant, resident._id)
  }

  // 退租
  async rentRecyle(address: IZone) {
    const residents: IResident[] = await this.residentModel.find({ address: address._id, checkResult: 2, isDelete: false, isDisable: false })
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'owner') {
        await this.roleService.findOneAndDelete({ role: 5, user: resident.user, zone: resident.address })
      }
      await this.deleteById(resident._id, resident.reviewer)
      await this.residentModel.findByIdAndUpdate(resident._id, { isDelete: true })

    }))
    await this.residentModel.findOneAndUpdate({ isDisable: true, type: 'owner', address: address._id, user: address.owner }, { isDisable: false, isDelete: false })
    await this.residentModel.update({ reviewer: address.owner, isDelete: false }, { isDisable: false })
    return
  }

  // 删除访客
  async removeVisitor() {
    const visitors = await this.residentModel.find({ type: 'visitor', isDelete: false, isDisable: false, expireTime: { $lt: Date.now() } })
    await Promise.all(visitors.map(async visitor => {
      const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: visitor._id, isDelete: false })
      await Promise.all(faces.map(async face => {
        return await this.faceService.delete(face)
      }))
      await this.residentModel.findByIdAndUpdate(visitor._id, { isDelete: true }).lean().exec();
    }))
  }

  // 根据用户id查询住客列表
  async findByCondition(condition: any): Promise<IResident[]> {
    return await this.residentModel.find(condition)
  }
}
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
// import { RoleDTO } from '../role/dto/role.dto';
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

  async sendVerifyMessage(house: string, reviewer: string, type, openId: string) {
    // 发送审核通过消息
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${house}${type}申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核通过',
        color: "#173177"
      },
      keyword2: {
        value: reviewer,
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
        value: 'AI设备同步成功后可刷脸进出小区，登陆小门神查看详情',
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(openId, message)
  }

  // 发送待审核通知
  async sendApplicationMessage(applicant: IUser, house: string, openId: string) {
    const message: ApplicationDTO = {
      first: {
        value: `您收到一条${house}的家人申请`,
        color: "#173177"
      },
      keyword1: {
        value: applicant.username,
        color: "#173177"
      },
      keyword2: {
        value: applicant.phone,
        color: "#173177"
      },
      keyword3: {
        value: moment().format('YYYY:MM:DD HH:mm:ss'),
        color: "#173177"
      },
      keyword4: {
        value: house,
        color: "#173177"
      },
      remark: {
        value: '请前往小门神智慧社区平台进行审核处理',
        color: "#173177"
      },
    }
    this.weixinUtil.sendApplicationMessage(openId, message)
  }

  // 申请重复确认
  async residentExist(address: string, user: string) {
    const exist = await this.residentModel.findOne({
      address,
      user,
      isDelete: false,
      checkResult: { $ne: 3 },
      isDisable: false,
    })
    if (exist) {
      throw new ApiException('已在或已申请该房屋', ApiErrorCode.APPLICATION_EXIST, 406);
    }
  }

  // 业主存在确认
  async hasOwner(address: string) {
    return await this.residentModel
      .findOne({ address, isDelete: false, isDisable: false, checkResult: { $in: [2, 4, 5] }, type: 'owner' })
      .exec()
  }

  // 是否家人
  async isFamily(address: string, user: string) {
    const family: IResident | null = await this.residentModel
      .findOne({ user, address, type: { $ne: 'visitor' }, isDelete: false, checkResult: 2 })
    if (!family) {
      throw new ApiException('无权限操作该房屋', ApiErrorCode.NO_PERMISSION, 403);
    }
  }

  // 是否是业主本人
  async isOwner(address: string, user: string) {
    const owner: IResident | null = await this.residentModel
      .findOne({ user, address, isDelete: false, isDisable: false, type: 'owner', checkResult: { $in: [2, 4, 5] } })
    if (!owner) {
      throw new ApiException('无权限操作该房屋', ApiErrorCode.NO_PERMISSION, 403);
    }
  }

  // 获取审核人
  async getReviewers(address: string) {
    const reviewers: IResident[] = await this.residentModel
      .find({ address, isDelete: false, type: { $in: ['family', 'owner'] }, isDisable: false, checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    return reviewers.map(reviewer => reviewer.user)
  }

  // 获取审核人
  async getMyHouses(user: string) {
    const residents: IResident[] = await this.residentModel
      .find({ user, isDelete: false, type: { $in: ['family', 'owner'] }, checkResult: { $in: [2, 4, 5] } })
      .lean()
      .exec()
    return residents.map(reviewer => reviewer.address)
  }

  // 获取审核人
  async getMyOwnerHouses(user: string) {
    const owner: any = []
    const myOwnerHouses: IZone[] = await this.zoneService.findByCondition({ owner: user })
    await Promise.all(myOwnerHouses.map(async myOwnerHouse => {
      const resident: IResident | null = await this.residentModel.findOne({ user, address: myOwnerHouse._id, })
      if (!resident) {
        return
      }
      let isRent = resident.isDisable
      owner.push({ ...myOwnerHouse, isRent })
    }))
    return owner
  }

  // 上报常住人至智能感知平台
  async uploadToZoc(userId: string, zoneId: string, profile: IZoneProfile, deviceIds: string[], phone: string, resident: string) {
    const userToZOC: IUser | null = await this.userService.updateById(userId, {})
    if (!userToZOC) {
      return
    }
    const zoneToZOC = await this.zoneService.findById(zoneId)
    const data = await this.zocUtil.genResidentData(profile, zoneToZOC.detail, userToZOC, deviceIds, phone)
    const time = moment().format('YYYYMMDDHHmmss');
    const zip = await this.zocUtil.genZip()
    await this.zocUtil.genResident(zip, time, [data])
    const result = await this.zocUtil.upload(zip, time)
    if (result.success) {
      await this.residentModel.findByIdAndUpdate(resident, { isZOCPush: true, ZOCZip: result.zipname, upTime: Date.now() })
    }
  }

  // 添加人员到设备
  async addToDevice(zone: IZone, user: IUser, resident: string, expire?: Date) {
    const zoneIds = [...zone.ancestor, zone._id]
    const devices: IDevice[] = await this.deviceService.findByCondition({ position: { $in: zoneIds } })
    // if (!expire) {
    //   let phone = user.phone
    //   if (!phone) {
    //     const owner = await this.userService.findById(zone.owner)
    //     if (!owner) {
    //       return
    //     }
    //     phone = owner.phone
    //   }
    //   const deviceIds = devices.map(device => String(device.deviceId))
    //   this.uploadToZoc(user._id, zone.zoneId, zone.profile, deviceIds, phone, resident)
    // }
    const img = await this.cameraUtil.getImg(user.faceUrl)
    await Promise.all(devices.map(async device => {
      const faceCheck: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id, bondToObjectId: resident, isDelete: false })
      if (faceCheck) {
        return
      }
      const faceExist: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id, isDelete: false, checkResult: 2 })
      if (!faceExist) {
        const face: CreateFaceDTO = {
          device: device._id,
          user: user._id,
          mode: 2,
          bondToObjectId: resident,
          bondType: 'resident',
          zone: zone.zoneId,
          checkResult: 1,
          faceUrl: user.faceUrl,
        }
        if (expire) {
          face.expire = expire;
        }
        const createFace = await this.faceService.create(face)
        return await this.cameraUtil.addOnePic(device, user, this.config.whiteMode, img, createFace)
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: user._id,
        mode: 2,
        libIndex: faceExist.libIndex,
        flieIndex: faceExist.flieIndex,
        pic: faceExist.pic,
        bondToObjectId: resident,
        bondType: 'resident',
        zone: zone.zoneId,
        checkResult: 2,
        faceUrl: user.faceUrl,
      }
      if (expire) {
        face.expire = expire;
      }
      await this.faceService.create(face);
    }))
    const checkResult = await this.faceService.checkResult(resident)
    await this.residentModel.findByIdAndUpdate(resident, { checkResult });
  }

  // 接受业主申请
  async agreeOwner(id: string, reviewer: string): Promise<boolean> {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    const owner: IResident | null = await this.hasOwner(resident.address._id)
    if (owner) {
      throw new ApiException('该房屋已有业主', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.residentModel.findByIdAndUpdate(id, {
      addTime: new Date(),
      checkTime: new Date(),
      reviewer,
      checkResult: 4,
      owner: resident.user._id,
    })

    // // 创建角色
    // const role: RoleDTO = {
    //   role: 4,
    //   description: '业主',
    //   user: resident.user._id,
    //   zone: resident.address._id,
    //   checkResult: 2,
    //   reviewer,
    // }
    // await this.roleService.create(role)

    // 为房屋添加所有人
    await this.zoneService.updateOwner(resident.address._id, resident.user._id)
    const otherApplications: IResident[] = await this.residentModel.find({
      checkResult: 1,
      isDelete: false,
      isDisable: false,
      type: 'owner',
      address: resident.address,
    })

    // 同步人脸到设备
    await this.addToDevice(resident.address, resident.user, id)

    // 拒绝其他申请
    await Promise.all(otherApplications.map(async application => await this.rejectOwner(application.id, reviewer)))

    // 发送审核通过消息
    this.sendVerifyMessage(resident.address.houseNumber, '物业', '业主', resident.user.openId)
    return true;
  }

  // 添加家人
  async addFamily(isMonitor: boolean, isPush: boolean, user: IUser, zone: IZone, owner: string, reviewer?: string, ): Promise<IResident> {
    const resident: ResidentDTO = {
      zone: zone.zoneId,
      address: zone._id,
      user: user._id,
      checkResult: 4,
      applicationTime: new Date(),
      isMonitor,
      isPush,
      addTime: new Date(),
      type: 'family',
      checkTime: new Date(),
      reviewer,
      owner,
    }
    const creatResident = await this.residentModel.create(resident);
    await this.addToDevice(zone, user, creatResident._id)
    return creatResident;
  }

  // 添加访客
  async addVisitor(address: IZone, user: IUser, owner: string, reviewer: string, expireTime: Date) {
    await this.residentExist(address._id, user._id)
    const resident: ResidentDTO = {
      zone: address.zoneId,
      address: address._id,
      user: user._id,
      checkResult: 4,
      isMonitor: true,
      applicationTime: new Date(),
      addTime: new Date(),
      type: 'visitor',
      checkTime: new Date(),
      expireTime,
      reviewer,
      owner,
    }
    const creatResident = await this.residentModel.create(resident);
    await this.addToDevice(address, user, creatResident._id, expireTime);
    return
  }

  // 根据id查询
  async findById(id: string): Promise<IResident> {
    const resident: IResident | null = await this.residentModel.findById(id).lean().exec();
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return resident;
  }
  /**
   * 基础功能
   */

  // 用户申请业主
  async ownerApply(createResidentDTO: CreateResidentDTO, user: IUser) {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    await this.residentExist(createResidentDTO.address, user._id)
    const owner: IResident | null = await this.hasOwner(createResidentDTO.address)
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
      owner: user._id,
    }
    const creatResident = await this.residentModel.create(resident);
    // 根据物业表格自动通过业主申请
    const ownerCheck = await this.preownerService.ownerCheck(user.cardNumber, zone.zoneId, zone.houseNumber)
    if (ownerCheck) {
      await this.agreeOwner(creatResident._id, user._id)
    }
    return;
  }

  // 常住人申请
  async familyApply(family: CreateResidentDTO, user: IUser) {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const owner: IResident | null = await this.hasOwner(family.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.residentExist(family.address, user._id)

    const zone: IZone = await this.zoneService.findById(family.address)
    const resident: ResidentDTO = {
      address: family.address,
      zone: zone.zoneId,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      isMonitor: false,
      type: 'family',
      owner: owner.user,
    }
    await this.residentModel.create(resident);

    const reviewers = await this.getReviewers(family.address)
    return reviewers.map(reviewer => this.sendApplicationMessage(user, zone.houseNumber, reviewer.openId))
  }

  // 访客申请
  async visitorApply(visitor: CreateResidentDTO, user: IUser) {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const owner: IResident | null = await this.hasOwner(visitor.address)
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
      owner: owner.user,
    }
    await this.residentModel.create(resident);

    const reviewers = await this.getReviewers(visitor.address)
    return reviewers.map(reviewer => this.sendApplicationMessage(user, zone.houseNumber, reviewer.openId))
  }


  /**
   * 家人功能
   */

  // 手动录入常住人
  async addFamilyByInput(family: CreateFamilyDTO, userId: string, ip: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isFamily(zone._id, userId)
    const owner: IResident | null = await this.hasOwner(family.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
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
    } else if (String(createUser._id) === String(userId)) {
      throw new ApiException('身份证已被注册', ApiErrorCode.PHONE_EXIST, 406);
    } else {
      await this.userService.updateById(createUser._id, { faceUrl: family.user.faceUrl, username: family.user.username })
    }
    await this.residentExist(family.address, createUser._id)
    return await this.addFamily(family.isMonitor, false, createUser, zone, owner.user, userId)
  }

  async addFamilyByScan(family: CreateFamilyByScanDTO, userId: string): Promise<IResident> {
    const zone: IZone = await this.zoneService.findById(family.address)
    await this.isFamily(zone._id, userId)
    const owner: IResident | null = await this.hasOwner(family.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    const user = await this.weixinUtil.scan(family.key)
    if (user.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    await this.residentExist(family.address, user._id)
    return await this.addFamily(family.isMonitor, family.isPush, user, zone, owner.user, userId)
  }

  // 扫码添加访客
  async addVisitorByScan(visitor: CreateVisitorByOwnerDTO, userId: string) {
    const zone: IZone = await this.zoneService.findById(visitor.address)
    await this.isFamily(zone._id, userId)
    const owner: IResident | null = await this.hasOwner(visitor.address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    const expireTime = moment().startOf('d').add(visitor.expireTime, 'd').toDate()
    const user = await this.weixinUtil.scan(visitor.key)
    if (user.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.addVisitor(zone, user, owner.user, userId, expireTime)
  }

  // 链接访问
  async addVisitorByLink(key: string, user: IUser) {
    const link: any = await this.weixinUtil.scan(key);
    const { address, type, reviewer } = link
    const owner: IResident | null = await this.hasOwner(address)
    if (!owner) {
      throw new ApiException('该房屋还没有业主，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    const zone: IZone = await this.zoneService.findById(address)
    const expireTime = moment().startOf('d').add(1, 'd').toDate()
    if (type !== 'visitor') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.addVisitor(zone, user, owner.user, reviewer, expireTime)
  }

  // 生成访问链接
  async getVisitorLink(address: string, user: IUser) {
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

  // 根据id修改家人
  async updateFamilyById(id: string, update: UpdateFamilyDTO, user: string) {
    const resident: IResident | null = await this.residentModel
      .findById(id)
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    await this.isFamily(resident.address, user)
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

  // 修改访客
  async updateVisitorById(id: string, update: AgreeVisitorDTO, user: string) {
    const resident: IResident | null = await this.findById(id)
    if (!resident) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    await this.isFamily(resident.address, user)
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

  // 我的待审列表
  async myReviews(pagination: Pagination, user: string): Promise<IList<IResident>> {
    const houses = await this.getMyHouses(user)
    console.log(houses, 'house')
    const condition: any = { address: { $in: houses }, isDelete: false, checkResult: 1, type: { $ne: 'owner' } };
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

  // 接受常住人申请
  async agreeFamily(id: string, user: IUser, agree: AgreeFamilyDTO) {
    const resident: any = await this.residentModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (resident.type !== 'family') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isFamily(resident.address._id, user._id)
    await this.residentModel.findByIdAndUpdate(id, {
      isPush: agree.isMonitor,
      isMonitor: agree.isPush,
      reviewer: user._id,
      checkResult: 4,
      addTime: new Date(),
      checkTime: new Date(),
    })
    await this.addToDevice(resident.address, resident.user, id)
    return this.sendVerifyMessage(resident.address.houseNumber, user.username, '家人', resident.user.openId)
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
    await this.isFamily(resident.address._id, user._id)
    await this.residentModel.findByIdAndUpdate(id, {
      expireTime,
      reviewer: user._id,
      addTime: new Date(),
      checkTime: new Date(),
      checkResult: 4,
    })
    await this.addToDevice(resident.address, resident.user, id, expireTime)

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
        value: `人脸同步成功后可以刷脸进出小区，有效期至${moment(expireTime).format('YYYY:MM:DD HH:mm:ss')} `,
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
      reviewer: user._id,
      checkTime: new Date(),
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber} ${resident.tpye === 'family' ? '家人' : '访客'} 申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核不通过',
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


  /**
   * 物业相关功能
   */

  // 业主管理列表
  async ownerApplications(pagination: Pagination, user: string, checkResult: number) {
    if (!pagination.zone) {
      return { list: [], total: 0 }
    }
    const zone = pagination.zone;
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    let check: any = checkResult
    if (checkResult === 2) {
      check = { $in: [2, 4, 5] }
    }
    const condition = { isDelete: false, type: 'owner', zone, checkResult: check, isRent: { $exists: false } }
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

  // 业主审核不通过
  async rejectOwner(id: string, reviewer: string): Promise<boolean> {
    const resident: any = await this.residentModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
      reviewer,
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${resident.address.houseNumber}业主申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核不通过',
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
        value: '请核对提交信息是否准确，确定无误后可再发出申请',
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(resident.user.openId, message)
    return true;
  }


  // 获取已申请房屋列表
  async getApplications(pagination: Pagination, userId: string, type: string): Promise<IList<IResident>> {
    let typeCondition: any = 'visitor'
    if (type === 'family') {
      typeCondition = { $ne: 'visitor' }
    }
    const condition: any = { type: typeCondition, isDelete: false, user: userId };
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



  /**
   * 超级管理员相关功能
   */
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
        condition.$in = search;
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
  async deleteById(resident: string, user: string, isRent?: boolean): Promise<IResident | null> {
    const data: IResident | null = await this.residentModel.findById(resident).lean()
    console.log(data, 'data')
    if (!data) {
      return null
    }
    if (data.type === 'owner' && !isRent) {
      throw new ApiException('业主不可删除', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isFamily(data.address, user)
    const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: resident, isDelete: false })
    console.log(faces, 'faces')
    await Promise.all(faces.map(async face => {
      return await this.faceService.delete(face)
    }))
    const checkResult = await this.faceService.checkResult(resident)
    return await this.residentModel.findByIdAndUpdate(resident, { isDelete: true, checkResult })
  }



  // 常住人列表
  async families(user: string): Promise<any> {
    const houses: IResident[] = await this.residentModel
      .find({ user, isDelete: false, type: { $in: ['family', 'owner'] }, checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec()
    return await Promise.all(houses.map(async house => {
      const condition: any = {
        address: house.address._id,
        owner: house.owner,
        isDelete: false,
        type: { $in: ['family', 'owner'] },
        checkResult: { $in: [2, 4, 5] },
      };
      const users: IResident[] = await this.residentModel
        .find(condition)
        .sort({ type: -1 })
        .populate({ path: 'user', model: 'user', select: '-openId' })
        .lean()
        .exec()
      return { address: house.address, users, isRent: house.isDisable, isOwner: String(house.owner) === String(house.address.owner) }
    }))
  }

  // 访客列表
  async visitors(user: string): Promise<any> {
    const houses: IResident[] = await this.residentModel
      .find({ user, isDelete: false, type: { $in: ['family', 'owner'] }, checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec()
    return await Promise.all(houses.map(async house => {
      const condition: any = {
        address: house.address._id,
        owner: house.owner,
        isDelete: false,
        type: 'visitor',
        checkResult: { $in: [2, 4, 5] },
      };
      const users: IResident[] = await this.residentModel
        .find(condition)
        .populate({ path: 'user', model: 'user', select: '-openId' })
        .lean()
        .exec()
      return { address: house.address, users, isRent: house.isDisable, isOwner: String(house.owner) === String(house.address.owner) }
    }))
  }

  // 出租
  async rent(tenant: IUser, address: IZone) {
    const residents: IResident[] = await this.residentModel.find({ address: address._id, isDelete: false })
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'visitor') {
        const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: resident._id, isDelete: false })
        await Promise.all(faces.map(async face => await this.faceService.delete(face._id)))
        const checkResult = await this.faceService.checkResult(resident._id)
        return await this.residentModel.findByIdAndUpdate(resident._id, { isDelete: true, checkResult })
      }
      return await this.residentModel.findByIdAndUpdate(resident._id, { isDisable: true, checkResult: 2 })
    }))
    const createResident: ResidentDTO = {
      zone: address.zoneId,
      address: address._id,
      user: tenant._id,
      checkResult: 4,
      applicationTime: new Date(),
      isMonitor: false,
      isPush: true,
      type: 'owner',
      addTime: new Date(),
      checkTime: new Date(),
      isRent: true,
      reviewer: address.owner,
      owner: tenant._id,
    }
    const resident: IResident = await this.residentModel.create(createResident)
    // const role: RoleDTO = {
    //   role: 5,
    //   description: '租客',
    //   user: resident.user._id,
    //   zone: resident.address._id,
    //   checkResult: 2,
    //   reviewer: address.owner,
    // }
    // await this.roleService.create(role)
    return await this.addToDevice(address, tenant, resident._id)
  }

  // 退租
  async rentRecyle(address: IZone) {
    const residents: IResident[] = await this.residentModel.find({ address: address._id, checkResult: 2, isDelete: false, isDisable: false })
    await Promise.all(residents.map(async resident => {
      // if (resident.type === 'owner') {
      //   await this.roleService.findOneAndDelete({ role: 5, user: resident.user, zone: resident.address })
      // }
      await this.residentModel.findByIdAndUpdate(resident._id, { isDelete: true, checkResult: 4 })
      await this.deleteById(resident._id, resident.owner, true)
    }))
    await this.residentModel.findOneAndUpdate({ isDisable: true, type: 'owner', address: address._id, user: address.owner }, { isDisable: false })
    await this.residentModel.update({ owner: address.owner, isDelete: false }, { isDisable: false })
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
      const checkResult = await this.faceService.checkResult(visitor._id)
      return await this.residentModel.findByIdAndUpdate(visitor._id, { isDelete: true, checkResult })
    }))
  }

  // 根据用户id查询住客列表
  async findByCondition(condition: any): Promise<IResident[]> {
    return await this.residentModel.find(condition)
  }

  // 根据id修改
  async updateById(id: string, update: any): Promise<IResident | null> {
    return await this.residentModel.findByIdAndUpdate(id, update)
  }

  // 根据id修改
  async fix() {
    const residents = await this.residentModel.find({ isDelete: false });
    // await Promise.all(residents.map(async))
  }
}
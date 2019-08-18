import { Model } from 'mongoose';
import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';
import { ISchool } from './interfaces/school.interfaces';
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
import { WeixinUtil } from 'src/utils/weixin.util';
import { IFace } from '../face/interfaces/face.interfaces';
import { RoleService } from '../role/role.service';
import { ConfigService } from 'src/config/config.service';
import { ApplicationDTO } from 'src/common/dto/Message.dto';
import { PreownerService } from '../preowner/preowner.service';
import { ZOCUtil } from 'src/utils/zoc.util';
import { StudentDTO, HeadTeacherApplicationDTO, HeadTeacherDTO, StudentApplicationDTO, VisitorDTO, VisitorApplicationDTO, UpdateStudentDTO } from './dto/school.dto';

@Injectable()
export class SchoolService {
  constructor(
    @Inject('SchoolModelToken') private readonly schoolModel: Model<ISchool>,
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

  async updateByUser(user: string) {
    await this.schoolModel.updateMany({ user, isDelete: false, checkResult: { $in: [2, 4, 5] } }, { checkResult: 4 })
  }

  async sendVerifyMessage(house: string, reviewer: string, type, openId: string) {
    // 发送审核通过消息
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${house}的${type}申请已审核`,
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
        value: 'AI设备同步成功后可刷脸进出学校，登陆小门神查看详情',
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(openId, message)
  }

  // 发送待审核通知
  async sendApplicationMessage(applicant: { username: string, phone: string }, house: string, openId: string, type: string) {
    const message: ApplicationDTO = {
      first: {
        value: `您收到一条${house}的${type}申请`,
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
  async existCheck(address: string, user: string) {
    const exist = await this.schoolModel.findOne({
      address,
      user,
      isDelete: false,
      checkResult: { $ne: 3 },
    })
    if (exist) {
      throw new ApiException('已在或已申请该教室', ApiErrorCode.APPLICATION_EXIST, 406);
    }
  }

  // 班主任存在确认
  async hasOwner(address: string) {
    return await this.schoolModel
      .findOne({ address, isDelete: false, isDisable: false, checkResult: { $in: [2, 4, 5] }, type: 'owner' })
      .populate({ path: 'user', model: 'user' })
      .exec()
  }


  // 是否是班主任本人
  async isOwner(address: string, user: string) {
    const owner: ISchool | null = await this.schoolModel
      .findOne({ user, address, isDelete: false, isDisable: false, type: 'owner', checkResult: { $in: [2, 4, 5] } })
    if (!owner) {
      throw new ApiException('无权限操作该教室', ApiErrorCode.NO_PERMISSION, 403);
    }
  }

  // 是否是班主任
  async isTeacher(user: string) {
    const teacherCount = await this.schoolModel.countDocuments({ user, isDelete: false, type: 'owner' })
    return teacherCount > 0
  }

  // 是否是家长
  async isParent(user: string) {
    const teacherCount = await this.schoolModel.countDocuments({ type: 'student', isDelete: false, 'parent.user': user })
    return teacherCount > 0
  }

  // 是否家长或者班主任
  isParentOrHeadTeacher(student: ISchool, user: string) {
    let isParent = false
    student.parent.map(parent => {
      if (parent.user === String(user)) {
        isParent = true
      }
    })
    if (String(student.owner) !== user || !isParent) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    return
  }


  // 获取我的学校
  async getMySchools(user: string) {
    const schools: ISchool[] = await this.schoolModel
      .find({ user, isDelete: false, type: { $in: ['student', 'owner'] }, checkResult: { $in: [2, 4, 5] } })
      .lean()
      .exec()
    return schools.map(school => school.address)
  }

  // // 上报学生至智能感知平台
  // async uploadToZoc(userId: string, zoneId: string, profile: IZoneProfile, deviceIds: string[], phone: string, school: string) {
  //   const userToZOC: IUser | null = await this.userService.updateById(userId, {})
  //   if (!userToZOC) {
  //     return
  //   }
  //   const zoneToZOC = await this.zoneService.findById(zoneId)
  //   const data = await this.zocUtil.genSchoolData(profile, zoneToZOC.detail, userToZOC, deviceIds, phone)
  //   const time = moment().format('YYYYMMDDHHmmss');
  //   const zip = await this.zocUtil.genZip()
  //   await this.zocUtil.genSchool(zip, time, [data])
  //   const result = await this.zocUtil.upload(zip, time)
  //   if (result.success) {
  //     const client = this.redis.getClient()
  //     client.hincrby(this.config.LOG, this.config.LOG_RESIDENT, 1)
  //     await this.schoolModel.findByIdAndUpdate(school, { isZOCPush: true, ZOCZip: result.zipname, upTime: Date.now() })
  //   }
  // }

  // 添加人员到设备
  async addToDevice(zone: IZone, user: IUser, school: string, expire?: Date) {
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
    //   this.uploadToZoc(user._id, zone.zoneId, zone.profile, deviceIds, phone, school)
    // }
    const img = await this.cameraUtil.getImg(user.faceUrl)
    await Promise.all(devices.map(async device => {
      const faceCheck: IFace | null = await this.faceService.findOne({ bondToObjectId: school, device: device._id, isDelete: false })
      if (faceCheck) {
        return
      }
      const faceExist: IFace | null = await this.faceService.findOne({ user: user._id, device: device._id, isDelete: false, checkResult: 2 })
      if (!faceExist) {
        const face: CreateFaceDTO = {
          device: device._id,
          user: user._id,
          mode: 2,
          bondToObjectId: school,
          bondType: 'school',
          zone: zone.zoneId,
          checkResult: 1,
          // faceUrl: user.faceUrl,
        }
        if (expire) {
          face.expire = expire;
        }
        return await this.faceService.addOnePic(face, device, user, this.config.whiteMode, img)
      }
      const face: CreateFaceDTO = {
        device: device._id,
        user: user._id,
        mode: 2,
        libIndex: faceExist.libIndex,
        flieIndex: faceExist.flieIndex,
        pic: faceExist.pic,
        bondToObjectId: school,
        bondType: 'school',
        zone: zone.zoneId,
        checkResult: 2,
        // faceUrl: user.faceUrl,
      }
      if (expire) {
        face.expire = expire;
      }
      await this.faceService.create(face);
    }))
    const checkResult = await this.faceService.checkResult(school)
    await this.schoolModel.findByIdAndUpdate(school, { checkResult });
  }

  // 接受班主任申请
  async agreeOwner(id: string, reviewer: string): Promise<boolean> {
    const headTeacher: ISchool = await this.schoolModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    const owner: ISchool | null = await this.hasOwner(headTeacher.address._id)
    if (owner) {
      throw new ApiException('该教室已有班主任', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.schoolModel.findByIdAndUpdate(id, {
      addTime: new Date(),
      checkTime: new Date(),
      reviewer,
      checkResult: 4,
      owner: headTeacher.user._id,
    })

    // 为教室添加所有人
    await this.zoneService.updateOwner(headTeacher.address._id, headTeacher.user._id)
    const otherApplications: ISchool[] = await this.schoolModel.find({
      checkResult: 1,
      isDelete: false,
      isDisable: false,
      type: 'owner',
      address: headTeacher.address._id,
    })

    // 同步人脸到设备
    await this.addToDevice(headTeacher.address, headTeacher.user, id)

    // 拒绝其他申请
    await Promise.all(otherApplications.map(async application => await this.rejectOwner(application.id, reviewer)))

    // 发送审核通过消息
    this.sendVerifyMessage(headTeacher.address.houseNumber, '教务', '班主任', headTeacher.user.openId)
    const client = this.redis.getClient()
    await client.hincrby(this.config.LOG, this.config.LOG_OWNER, 1)
    return true;
  }

  // 添加学生
  // async addStudent(user: IUser, address: IZone, owner: string, reviewer: string, parent: string): Promise<ISchool> {
  //   await this.existCheck(address._id, user._id)
  //   const now = new Date()
  //   const student: StudentDTO = {
  //     zone: address.zoneId,
  //     address: address._id,
  //     user: user._id,
  //     checkResult: 4,
  //     applicationTime: now,
  //     addTime: now,
  //     type: 'student',
  //     checkTime: now,
  //     reviewer,
  //     owner,
  //     parent: [parent]
  //   }
  //   const createStudent = await this.schoolModel.create(student);
  //   await this.addToDevice(address, user, createStudent._id)
  //   return createStudent;
  // }

  // 添加访客
  // async addVisitor(address: IZone, user: IUser, owner: string, reviewer: string, expireTime: Date) {
  //   await this.schoolExist(address._id, user._id)
  //   const school: SchoolDTO = {
  //     zone: address.zoneId,
  //     address: address._id,
  //     user: user._id,
  //     checkResult: 4,
  //     isMonitor: true,
  //     applicationTime: new Date(),
  //     addTime: new Date(),
  //     type: 'visitor',
  //     checkTime: new Date(),
  //     expireTime,
  //     reviewer,
  //     owner,
  //   }
  //   const creatSchool = await this.schoolModel.create(school);
  //   await this.addToDevice(address, user, creatSchool._id, expireTime);
  //   return
  // }

  // 根据id查询
  async findById(id: string): Promise<ISchool> {
    const school: ISchool | null = await this.schoolModel.findById(id).lean().exec();
    if (!school) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    return school;
  }
  /**
   * 基础功能
   */

  // 用户申请班主任
  async ownerApply(createSchoolDTO: HeadTeacherApplicationDTO, user: IUser) {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    await this.existCheck(createSchoolDTO.address, user._id)
    const owner: ISchool | null = await this.hasOwner(createSchoolDTO.address)
    if (owner) {
      throw new ApiException('该教室已有班主任', ApiErrorCode.NO_PERMISSION, 403);
    }
    const zone: IZone = await this.zoneService.findById(createSchoolDTO.address)
    const headTeacher: HeadTeacherDTO = {
      zone: zone.zoneId,
      address: createSchoolDTO.address,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      type: 'owner',
    }
    const creatHeadTeacher = await this.schoolModel.create(headTeacher);
    // // 根据教务表格自动通过班主任申请
    // const ownerCheck = await this.preownerService.ownerCheck(user.cardNumber, zone.zoneId, zone.houseNumber)
    // if (ownerCheck) {
    //   await this.agreeOwner(creatSchool._id, user._id)
    // }
    return creatHeadTeacher;
  }

  // 学生申请
  async studentApply(studentApplication: StudentApplicationDTO, parent: IUser) {
    if (!parent.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const studentUser: IUser | null = await this.userService.findById(studentApplication.user)
    if (!studentUser) {
      throw new ApiException('该学生不存在', ApiErrorCode.NO_EXIST, 406);
    }
    if (!studentUser.isVerify) {
      throw new ApiException('该学生尚未实名认证', ApiErrorCode.NO_EXIST, 406);
    }
    const owner: ISchool | null = await this.hasOwner(studentApplication.address)
    if (!owner || !owner.user) {
      throw new ApiException('该教室还没有班主任，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }

    await this.existCheck(studentApplication.address, studentUser._id)
    const zone: IZone = await this.zoneService.findById(studentApplication.address)
    const student: StudentDTO = {
      address: studentApplication.address,
      zone: zone.zoneId,
      user: studentUser._id,
      checkResult: 1,
      applicationTime: new Date(),
      type: 'student',
      owner: owner.user,
      parent: [{ user: parent._id, parentType: studentApplication.parentType }],
    }
    await this.schoolModel.create(student);
    this.sendApplicationMessage({ username: studentUser.username, phone: parent.phone }, zone.houseNumber, owner.user.openId, '学生')
    return
  }

  // 访客申请
  async visitorApply(visitorApplication: VisitorApplicationDTO, user: IUser) {
    if (!user.isVerify) {
      throw new ApiException('尚未实名认证', ApiErrorCode.NO_VERIFY, 406);
    }
    const owner: ISchool | null = await this.hasOwner(visitorApplication.address)
    if (!owner || !owner.user) {
      throw new ApiException('该教室还没有班主任，无法申请', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.existCheck(visitorApplication.address, user._id)
    const zone: IZone = await this.zoneService.findById(visitorApplication.address)
    const expireTime = moment().startOf('d').add(1, 'd').toDate()
    const visitor: VisitorDTO = {
      ...visitorApplication,
      zone: zone.zoneId,
      user: user._id,
      checkResult: 1,
      applicationTime: new Date(),
      type: 'visitor',
      owner: owner.user,
      expireTime,
    }
    await this.schoolModel.create(visitor);
    this.sendApplicationMessage(user, zone.houseNumber, owner.user.openId, '访客')
    return
  }

  /**
   * 班主任功能
   */
  // 生成访问链接
  async getLink(address: string, user: IUser, name: string, type: string) {
    const zone: IZone = await this.zoneService.findById(address)
    await this.isOwner(zone._id, user._id)
    const key = uuid()
    const client = this.redis.getClient()
    const value = {
      name,
      address: zone._id,
      type,
      username: user.username,
      reviewer: user._id,
    };
    await client.set(key, JSON.stringify(value), 'EX', 60 * 60);
    return key
  }

  // 根据id修改学生
  async updateStudentById(id: string, update: UpdateStudentDTO, user: string) {
    const student: ISchool | null = await this.schoolModel
      .findById(id)
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!student) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }

    await this.isParentOrHeadTeacher(student, String(user))

    if (student.type !== 'student') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    if (!student.user.isPhoneVerify) {
      const user: IUser | null = await this.userService.updateById(student.user._id, { ...update })
      if (!user) {
        throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
      }
      if (update.faceUrl) {
        await this.faceService.updatePic(user, update.faceUrl)
      }
    }
  }

  // 绑定家长
  async bindParent(id: string, user: string, key: string, parentType: string) {
    const parent = await this.weixinUtil.scan(key)
    if (parent.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    const student: ISchool | null = await this.schoolModel
      .findById(id)
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!student) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }

    await this.isParentOrHeadTeacher(student, String(user))

    let isParent = false
    student.parent.map(parent => {
      if (parent.user === String(user)) {
        isParent = true
      }
    })
    if (!isParent) {
      await this.schoolModel.findByIdAndUpdate(id, { $push: { parentType, user: String(parent._id) } })
    }
    return
  }

  // 我的待审列表
  async myReviews(pagination: Pagination, user: string): Promise<IList<ISchool>> {
    const schools = await this.getMySchools(user)
    const condition: any = { address: { $in: schools }, isDelete: false, checkResult: 1, type: { $ne: 'owner' } };
    const list: ISchool[] = await this.schoolModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ applicationTime: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.schoolModel.countDocuments(condition);
    return { list, total };
  }

  // 接受学生申请
  async agreeStudent(id: string, user: IUser) {
    const student: ISchool = await this.schoolModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'parent.user', model: 'user' })
      .lean()
      .exec()
    if (!student) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (student.type !== 'student') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(student.address._id, user._id)
    await this.schoolModel.findByIdAndUpdate(id, {
      reviewer: user._id,
      checkResult: 4,
      addTime: new Date(),
      checkTime: new Date(),
    })
    await this.addToDevice(student.address, student.user, id)

    student.parent.map(async parent => {
      return this.sendVerifyMessage(student.address.houseNumber, user.username, '学生', parent.user.openId)
    })
    return
  }

  // 接受常访客申请
  async agreeVisitor(id: string, user: IUser): Promise<boolean> {
    const visitor: ISchool = await this.schoolModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec()
    if (!visitor) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (visitor.type !== 'visitor') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(visitor.address._id, user._id)
    await this.schoolModel.findByIdAndUpdate(id, {
      reviewer: user._id,
      addTime: new Date(),
      checkTime: new Date(),
      checkResult: 4,
    })
    await this.addToDevice(visitor.address, visitor.user, id, visitor.expireTime)

    const message: ApplicationDTO = {
      first: {
        value: `您提交的${visitor.address.houseNumber}访客申请已审核`,
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
        value: `人脸同步成功后可以刷脸进出学校，有效期至${moment(visitor.expireTime).format('YYYY:MM:DD HH:mm:ss')} `,
        color: "#173177"
      },
    }
    this.weixinUtil.sendVerifyMessage(visitor.user.openId, message)
    return true;
  }

  // 拒绝学生申请
  async rejectApplication(id: string, user: IUser): Promise<boolean> {
    const application: ISchool = await this.schoolModel
      .findById(id)
      .populate({ path: 'address', model: 'zone' })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'parent.user', model: 'user' })
      .lean()
      .exec()
    if (application.type === 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.isOwner(application.address, user._id)
    await this.schoolModel.findByIdAndUpdate(id, {
      checkResult: 3,
      reviewer: user._id,
      checkTime: new Date(),
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${application.address.houseNumber} ${application.type === 'student' ? '学生' : '访客'} 申请已审核`,
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
    if (application.type === 'visitor') {
      this.weixinUtil.sendVerifyMessage(application.user.openId, message)
    } else if (application.type === 'student') {
      application.parent.map(async parent => {
        return this.weixinUtil.sendVerifyMessage(parent.user.openId, message)
      })
    }
    return true;
  }


  /**
   * 教务相关功能
   */

  // 班主任管理列表
  async ownerApplications(pagination: Pagination, user: string, checkResult: number) {
    if (!pagination.zone) {
      return { list: [], total: 0 }
    }
    const zone = pagination.zone;
    const canActive = await this.roleService.checkRoles({ isDelete: false, role: 5, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    let check: any = checkResult
    if (checkResult === 2) {
      check = { $in: [2, 4, 5] }
    }
    const condition = { isDelete: false, type: 'owner', zone, checkResult: check, isRent: { $exists: false } }
    const list: ISchool[] = await this.schoolModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ applicationTime: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .populate({ path: 'user', model: 'user' })
      .lean()
      .exec();
    const total = await this.schoolModel.countDocuments(condition);
    return { list, total };
  }

  // 教务通过班主任审核
  async agreeOwnerByManagement(id: string, user: string) {
    const headTeacher: ISchool = await this.findById(id)
    if (headTeacher.type !== 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const canActive = await this.roleService.checkRoles({ user, isDelete: false, role: 5, zone: headTeacher.zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.agreeOwner(id, user);
  }

  // 教务通过班主任审核
  async rejectOwnerByManagement(id: string, user: string) {
    const headTeacher: ISchool = await this.findById(id)
    if (headTeacher.type !== 'owner') {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const canActive = await this.roleService.checkRoles({ user, isDelete: false, role: 5, zone: headTeacher.zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    return await this.rejectOwner(id, user);
  }

  // 班主任审核不通过
  async rejectOwner(id: string, reviewer: string): Promise<boolean> {
    const headTeacher: any = await this.schoolModel.findByIdAndUpdate(id, {
      checkResult: 3,
      checkTime: new Date(),
      reviewer,
    })
    const message: ApplicationDTO = {
      first: {
        value: `您提交的${headTeacher.address.houseNumber}班主任申请已审核`,
        color: "#173177"
      },
      keyword1: {
        value: '审核不通过',
        color: "#173177"
      },
      keyword2: {
        value: '教务',
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
    this.weixinUtil.sendVerifyMessage(headTeacher.user.openId, message)
    return true;
  }


  // 获取已申请教室列表
  async getApplications(pagination: Pagination, userId: string, type: string): Promise<IList<ISchool>> {
    const condition: any = { type, isDelete: false, user: userId };
    const list: ISchool[] = await this.schoolModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec();
    const total = await this.schoolModel.countDocuments(condition);
    return { list, total };
  }



  // /**
  //  * 超级管理员相关功能
  //  */
  // // 查询全部数据
  // async getOwnerApplications(pagination: Pagination, condition: any): Promise<IList<ISchool>> {
  //   const search: any = [];
  //   if (pagination.search) {
  //     const sea = JSON.parse(pagination.search);
  //     for (const key in sea) {
  //       if (key === 'base' && sea[key]) {
  //         const value = sea[key].trim();
  //         const zones: IZone[] = await this.zoneService.findByCondition({ name: new RegExp(value, 'i') });
  //         const users: IUser[] = await this.userService.findByCondition({ username: new RegExp(value, 'i') });
  //         const zoneIds: string[] = zones.map(zone => zone._id)
  //         const userIds: string[] = users.map(user => user._id)
  //         search.push({ zone: { $in: zoneIds } });
  //         search.push({ user: { $in: userIds } })
  //       } else if (sea[key] === 0 || sea[key]) {
  //         condition[key] = sea[key];
  //       }
  //     }
  //     if (search.length) {
  //       condition.$in = search;
  //     }
  //   }
  //   const list = await this.schoolModel
  //     .find(condition)
  //     .limit(pagination.limit)
  //     .skip((pagination.offset - 1) * pagination.limit)
  //     .sort({ status: 1 })
  //     .populate({ path: 'address', model: 'zone' })
  //     .populate({ path: 'user', model: 'user' })
  //     .lean()
  //     .exec();
  //   const total = await this.schoolModel.countDocuments(condition);
  //   return { list, total };
  // }

  // 根据id删除
  async deleteById(school: string, user: string): Promise<ISchool | null> {
    const data: ISchool | null = await this.schoolModel.findById(school).lean()
    if (!data || data.isDelete) {
      return null
    }
    await this.isParentOrHeadTeacher(data, String(user))
    const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: school, isDelete: false })
    await Promise.all(faces.map(async face => {
      return await this.faceService.delete(face)
    }))
    const checkResult = await this.faceService.checkResult(school)
    return await this.schoolModel.findByIdAndUpdate(school, { isDelete: true, checkResult })
  }

  // 学生列表
  async students(user: string): Promise<any> {
    const schools: ISchool[] = await this.schoolModel
      .find({ user, isDelete: false, type: 'owner', checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec()
    return await Promise.all(schools.map(async school => {
      const condition: any = {
        address: school.address._id,
        isDelete: false,
        type: 'student',
        checkResult: { $in: [2, 4, 5] },
      };
      const users: ISchool[] = await this.schoolModel
        .find(condition)
        .sort({ type: -1 })
        .populate({ path: 'user', model: 'user', select: '-openId' })
        .populate({ path: 'reviewer', model: 'user', select: 'username' })
        .lean()
        .exec()
      return { address: school.address, users }
    }))
  }


  // 学生列表
  async children(user: string): Promise<any> {
    const children: ISchool[] = await this.schoolModel
      .find({ 'parent.user': user, isDelete: false, type: 'student', checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .populate({ path: 'user', model: 'user', select: '-openId' })
      .populate({ path: 'reviewer', model: 'user', select: 'username' })
      .lean()
      .exec()
    return await Promise.all(children.map(async child => {
      return { address: child.address, user: child.user }
    }))
  }

  // 访客列表
  async visitors(user: string): Promise<any> {
    const schools: ISchool[] = await this.schoolModel
      .find({ user, isDelete: false, type: 'owner', checkResult: { $in: [2, 4, 5] } })
      .populate({ path: 'address', model: 'zone', populate: { path: 'zoneId', model: 'zone' } })
      .lean()
      .exec()
    return await Promise.all(schools.map(async school => {
      const condition: any = {
        address: school.address._id,
        isDelete: false,
        type: 'visitor',
        checkResult: { $in: [2, 4, 5] },
      };
      const users: ISchool[] = await this.schoolModel
        .find(condition)
        .populate({ path: 'user', model: 'user', select: '-openId' })
        .populate({ path: 'reviewer', model: 'user', select: 'username' })
        .lean()
        .exec()
      return { address: school.address, users }
    }))
  }

  // 删除访客
  async removeVisitor() {
    const visitors = await this.schoolModel.find({ type: 'visitor', isDelete: false, expireTime: { $lt: Date.now() } })
    await Promise.all(visitors.map(async visitor => {
      const faces: IFace[] = await this.faceService.findByCondition({ bondToObjectId: visitor._id, isDelete: false })
      await Promise.all(faces.map(async face => {
        return await this.faceService.delete(face)
      }))
      const checkResult = await this.faceService.checkResult(visitor._id)
      return await this.schoolModel.findByIdAndUpdate(visitor._id, { isDelete: true, checkResult })
    }))
  }

  // 根据用户id查询住客列表
  async findByCondition(condition: any): Promise<ISchool[]> {
    return await this.schoolModel.find(condition)
  }

  // 根据id修改
  async updateById(id: string, update: any): Promise<ISchool | null> {
    return await this.schoolModel.findByIdAndUpdate(id, update)
  }

  async getSchoolByAddress(address: string): Promise<ISchool[]> {
    return this.schoolModel
      .find({ address, isDelete: false })
      .populate({ path: 'user', model: 'user', select: '_id username' })
      .populate({ path: 'reviewer', model: 'user', select: 'username' })
      .populate({ path: 'address', model: 'zone', select: 'houseNumber' })
      .lean()
      .exec()
  }

  async getSchoolByCardNumber(cardNumber: string): Promise<ISchool[]> {
    const user: IUser | null = await this.userService.findOneByCondition({ cardNumber, isDelete: false })
    if (!user) {
      return []
    }
    return this.schoolModel
      .find({ user: user._id })
      .populate({ path: 'user', model: 'user', select: '_id username' })
      .populate({ path: 'reviewer', model: 'user', select: 'username' })
      .populate({ path: 'address', model: 'zone', select: 'houseNumber' })
      .lean()
      .exec()
  }
}
import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as uuid from 'uuid/v4'
import { RedisService } from 'nestjs-redis';
import { UserService } from '../users/user.service';
import { DeviceService } from '../device/device.service';
import { CreatAttributeDTO } from '../orbit/dto/attribute.dto';
import { CreateStrangerDTO } from '../stranger/dto/stranger.dto';
import { IDevice } from '../device/interfaces/device.interfaces';
import { OrbitService } from '../orbit/orbit.service';
import { StrangerService } from '../stranger/stranger.service';
import { CreateOrbitDTO } from '../orbit/dto/orbit.dto';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { IUser } from '../users/interfaces/user.interfaces';
import { MessageService } from '../message/message.service';
import { IOrbit } from '../orbit/interfaces/orbit.interfaces';
import { ResidentService } from '../resident/resident.service';
import { IResident } from '../resident/interfaces/resident.interfaces';
import { CreateOrbitMessageDTO } from '../message/dto/message.dto';
import { MediaGateway } from '../media/media.gateway';
import { ApplicationDTO } from 'src/common/dto/Message.dto';
import { WeixinUtil } from 'src/utils/weixin.util';
import { ZoneService } from '../zone/zone.service';
import { IZone } from '../zone/interfaces/zone.interfaces';
import { ZOCUtil } from 'src/utils/zoc.util';
import { ConfigService } from 'src/config/config.service';
import { IBlack } from '../black/interfaces/black.interfaces';
import { BlackService } from '../black/black.service';
import { IRole } from '../role/interfaces/role.interfaces';
import { RoleService } from '../role/role.service';
import { ISchool } from '../school/interfaces/school.interfaces';
import { SchoolService } from '../school/school.service';

interface IReceiver {
  id: string;
  type: string;
}

@Injectable()
export class CallbackService {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(OrbitService) private readonly orbitService: OrbitService,
    @Inject(ResidentService) private readonly residentService: ResidentService,
    @Inject(SchoolService) private readonly schoolService: SchoolService,
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(StrangerService) private readonly strangerService: StrangerService,
    @Inject(QiniuUtil) private readonly qiniuUtil: QiniuUtil,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
    @Inject(ZOCUtil) private readonly zocUtil: ZOCUtil,
    @Inject(ZoneService) private readonly zoneService: ZoneService,
    @Inject(BlackService) private readonly blackService: BlackService,
    @Inject(RoleService) private readonly roleService: RoleService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly mediaWs: MediaGateway,
  ) { }

  /**
   * 获取10位时间戳
   */
  getTemp(): string {
    let tmp = Date.now().toString();
    tmp = tmp.substr(0, 10);
    return tmp;
  }

  async callback(body: any) {

    const { Name } = body
    // console.log(Name, 'name')
    let img: any = null;
    let imgex: any = null;
    let imgBase: any = null;
    let imgexBase: any = null;
    let deviceUUID: any = null;
    let mode;
    let userId;
    let Attribute: any = null;
    let profile: any = {}
    if (Name === 'CompareInfo') {
      deviceUUID = body.DeviceUUID
      imgBase = body.img
      imgexBase = body.imgex
      mode = body.WBMode
      Attribute = body.Attribute
      profile = {
        passTime: body.CaptureTime,
        compareResult: body.CompareResult,
        faceQuality: body.FaceQuality,
        faceFeature: body.FaceFeature,
        visitCount: body.VisitCount,
      }
      if (body.PicName) {
        userId = body.PicName.split('_')[1].replace('.jpg', '')
      }
    } else if (Name === 'captureInfoRequest') {
      const { DeviceInfo, CaptureInfo, FaceInfo, CompareInfo } = body.Data
      deviceUUID = DeviceInfo.DeviceUUID
      imgBase = CaptureInfo.FacePicture
      imgexBase = CaptureInfo.BackgroundPicture
      mode = CompareInfo.PersonType
      Attribute = CompareInfo.Attribute || {}
      profile = {
        passTime: CaptureInfo.CaptureTime,
        compareResult: CompareInfo.Similarity,
        faceQuality: FaceInfo.FaceQuality,
        faceFeature: null,
        visitCount: CompareInfo.VisitsCount,
      }

      if (mode !== 0) {
        userId = CompareInfo.PersonInfo.PersonId
      }
    }
    const device: IDevice | null = await this.deviceService.findByUUID(deviceUUID)
    if (!device) {
      return;
    }
    if (!imgBase) {
      return
    }
    img = await this.qiniuUtil.uploadB64(imgBase)
    if (device.media && Number(mode) !== 2) {
      await this.mediaWs.sendMessage(String(device.media), { type: String(body.WBMode), imgUrl: img })
    }
    if (imgexBase) {
      imgex = await this.qiniuUtil.uploadB64(imgexBase)
    }

    // const { Attribute } = body
    const attribute: CreatAttributeDTO = {
      age: Attribute.Age,
      gender: Attribute.Gender,
      glasses: Attribute.Glasses,
      mask: Attribute.Mask,
      race: Attribute.Race,
      beard: Attribute.Beard,
    }
    const stranger: CreateStrangerDTO = {
      device: device._id,
      zone: device.position._id,
      imgUrl: img,
      imgexUrl: imgex,
      attribute,
      ...profile
    }
    if (profile.compareResult < 0.8) {
      mode = 0
    }

    if (Number(mode) === 0) {
      await this.strangerService.create(stranger);
    } else if (Number(mode) === 2) {
      const client = this.redis.getClient()
      if (device.deviceType === 2) {
        await client.hincrby(this.config.LOG, this.config.LOG_OPEN, 1)
      }
      const user: IUser | null = await this.userService.updateById(userId, {})
      if (!user) {
        return
      }
      let isZOCPush = false
      let zipname = ''
      let phone = user.phone

      if (!phone) {
        const resident = await this.residentService.findByCondition({ user: userId, isDelete: false })

        const owner = await this.userService.findById(resident[0].reviewer)
        if (owner) {
          phone = owner.phone
        }
        const zone: IZone = await this.zoneService.findById(device.zone)
        const time = moment().format('YYYYMMDDHHmmss');
        const zip = await this.zocUtil.genZip()
        await this.zocUtil.genEnRecord(zip, time, zone.detail, user, device, phone)
        await this.zocUtil.genImage(zip, time, zone.detail, img)
        const data = await this.zocUtil.upload(zip, time)
        if (data.success) {
          isZOCPush = true
          zipname = data.zipname
          client.hincrby(this.config.LOG, this.config.LOG_ENRECORD, 1)
        }
      }
      const orbit: CreateOrbitDTO = { user: user._id, mode, isZOCPush, ZOCZip: zipname, ...stranger, upTime: Date.now() }
      const createOrbit: IOrbit = await this.orbitService.create(orbit);
      await this.sendMessage(createOrbit, user, device)
    } else if (Number(mode) === 1) {
      const black: IBlack | null = await this.blackService.findById(userId)
      if (!black) {
        return
      }
      const orbit: CreateOrbitDTO = { user: black._id, mode, ...stranger }
      const createOrbit: IOrbit = await this.orbitService.create(orbit);
      await this.sendBlackMessage(createOrbit, black, device)
    }
    return
  }

  // 发送消息
  async sendMessage(orbit: IOrbit, user: IUser, device: IDevice) {
    const receivers: IReceiver[] = await this.receivers(user, device.zone)
    console.log(receivers, 'receivers')
    return await Promise.all(receivers.map(async receiver => {
      const receiverUser: IUser | null = await this.userService.findById(receiver.id)
      if (!receiverUser) {
        return
      }
      const message: CreateOrbitMessageDTO = {
        sender: user._id,
        receiver: receiver.id,
        type: receiver.type,
        orbit: orbit._id,
        passType: device.passType,
        zone: device.zone,
        imgUrl: orbit.imgUrl,
        imgexUrl: orbit.imgexUrl,
        compareResult: orbit.compareResult,
        position: `${device.position.houseNumber}-${device.description}`
      }
      await this.messageService.createOrbitMessage(message)
      let userType;
      switch (receiver.type) {
        case 'family': userType === '家人'
          break;
        case 'student': userType === '小孩'
          break;
        case 'visitor': userType === '访客'
          break;
        default:
          break;
      }
      const application: ApplicationDTO = {
        first: {
          value: `您的${userType}${user.username}${device.passType === 1 ? '进入' : '离开'}了${device.position.houseNumber}-${device.description}`,
          color: "#173177"
        },
        keyword1: {
          value: userType,
          color: "#173177"
        },
        keyword2: {
          value: device.passType === 1 ? '进入' : '离开',
          color: "#173177"
        },
        keyword3: {
          value: user.username,
          color: "#173177"
        },
        keyword4: {
          value: moment().format('YYYY:MM:DD HH:mm:ss'),
          color: "#173177"
        },
        remark: {
          value: '详情可查看进出图像',
          color: "#173177"
        },
      }
      this.weixinUtil.sendPassMessage(receiverUser.openId, application)
    }))
  }

  // 发送消息
  async sendBlackMessage(orbit: IOrbit, black: IBlack, device: IDevice) {
    const receivers: IReceiver[] = await this.roleService.blackReceivers(device)
    return await Promise.all(receivers.map(async receiver => {
      const receiverUser: IUser | null = await this.userService.findById(receiver.id)
      if (!receiverUser) {
        return
      }
      const message: CreateOrbitMessageDTO = {
        sender: black._id,
        receiver: receiver.id,
        type: receiver.type,
        orbit: orbit._id,
        passType: device.passType,
        zone: device.zone,
        imgUrl: orbit.imgUrl,
        imgexUrl: orbit.imgexUrl,
        compareResult: orbit.compareResult,
        position: `${device.position.houseNumber}-${device.description}`
      }
      await this.messageService.createOrbitMessage(message)
      const application: ApplicationDTO = {
        first: {
          value: `${device.position.houseNumber}-${device.description}有异常人员通过`,
          color: "#173177"
        },
        keyword1: {
          value: '异常人员',
          color: "#173177"
        },
        keyword2: {
          value: device.passType === 1 ? '进入' : '离开',
          color: "#173177"
        },
        keyword3: {
          value: black.username,
          color: "#173177"
        },
        keyword4: {
          value: moment().format('YYYY:MM:DD HH:mm:ss'),
          color: "#173177"
        },
        remark: {
          value: '详情可查看进出图像',
          color: "#173177"
        },
      }
      this.weixinUtil.sendPassMessage(receiverUser.openId, application)
    }))
  }

  // 发送消息
  async receivers(user: IUser, zone: string): Promise<IReceiver[]> {
    const receivers: IReceiver[] = []
    const residents: IResident[] = await this.residentService.findByCondition({
      isDelete: false, user: user._id, checkResult: 2, isMonitor: true
    });
    const schools: ISchool[] = await this.schoolService.findByCondition({
      isDelete: false, user: user._id, checkResult: 2, type: 'student'
    })
    schools.map(school => {
      school.parent.map(parent => {
        receivers.push({ id: parent.user, type: 'student' })
      })
    })
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'visitor') {
        await this.visitorReceivers(resident, zone, receivers)
        await this.residentService.updateById(resident._id, { isMonitor: false })
      } else if (resident.type === 'family' && resident.isMonitor) {
        await this.familyReceivers(user, resident, receivers)
      }
    }))
    return receivers
  }

  // 访客推送人
  async visitorReceivers(resident: IResident, zone: string, receivers: IReceiver[]): Promise<IReceiver[]> {
    const residents: IResident[] = await this.residentService.findByCondition({
      zone,
      isDelete: false,
      isPush: true,
      address: resident.address,
      checkResult: 2
    })
    residents.map(resid => {
      if (String(resid.user) === String(resident.user)) {
        return
      }

      receivers.push({ id: resid.user, type: 'visitor' })
      // await this.residentService.updateById(resid._id, { isMonitor: false })
    })

    return receivers
  }

  // 访客推送人
  async familyReceivers(user: IUser, resident: IResident, receivers: IReceiver[]): Promise<IReceiver[]> {
    const number = user.cardNumber;
    const thisYear = moment().format('YYYY')
    let age;
    if (number.length > 15) {
      const birthYear = number.slice(6, 10)
      age = Number(thisYear) - Number(birthYear)
    } else {
      const birthYear = `19${number.slice(6, 8)}`
      age = Number(thisYear) - Number(birthYear)
    }
    if (age < 18 || age > 75) {
      const residents: IResident[] = await this.residentService.findByCondition({
        isDelete: false,
        isPush: true,
        address: resident.address,
        checkResult: 2
      })
      residents.map(resid => {
        if (String(resid.user) === String(resident.user)) {
          return
        }
        receivers.push({ id: resid.user, type: 'family' })
      })
    }
    return receivers
  }
  // 心跳包处理
  async keepalive(body: any) {
    const { Name } = body
    let uuid: string = ''
    if (Name === 'KeepAlive') {
      const { DeviceUUID } = body;
      uuid = DeviceUUID
    } else if (Name === 'heartbeatRequest') {
      const { DeviceUUID } = body.Data.DeviceInfo
      uuid = DeviceUUID
    }
    const client = this.redis.getClient()
    const exist = await client.hget('device', uuid)
    if (!exist || Number(exist) > 4) {
      const device: IDevice | null = await this.deviceService.findByUUID(uuid)
      if (!device) {
        return
      }
      if (await client.llen(`p2p_${device._id}`)) {
        await client.hset('p2p_pool', String(device._id), 1)
      }
      if (await client.llen(`p2pError_${device._id}`)) {
        await client.hset('p2pError_pool', String(device._id), 1)
      }
    }
    await client.hset('device', uuid, 1)

  }

  // 设备注册
  async register(body: any) {
    const { TimeStamp } = body
    const session = `${uuid()}_${TimeStamp}`
    const { DeviceUUID } = body.Data.DeviceInfo;
    await this.deviceService.updateSession(DeviceUUID, session)
    return {
      code: 1,
      data:
      {
        session,
      },
      message: 'success',
      name: 'registerResponse',
      timeStamp: TimeStamp,
    }


    // const client = this.redis.getClient()
    // const exist = await client.hget('device', DeviceUUID)
    // if (!exist || Number(exist) > 4) {
    //   const device: IDevice | null = await this.deviceService.findByUUID(DeviceUUID)
    //   if (!device) {
    //     return
    //   }
    //   await client.hset('p2p_pool', String(device._id), 1)
    //   await client.hset('p2pError_pool', String(device._id), 1)
    // }
    // await client.hset('device', DeviceUUID, 1)

  }

  // 心跳包处理
  async upDeviceToZOC(code: string) {
    const devices: IDevice[] = await this.deviceService.findByZoneId(code)
    const zone = await this.zoneService.findById(code)
    const { detail, propertyCo } = zone
    await Promise.all(devices.map(async device => {
      const time = moment().format('YYYYMMDDHHmmss');
      const zip = await this.zocUtil.genZip()
      // await this.zocUtil.genResident(zip, time, residents)
      await this.zocUtil.genBasicAddr(zip, time, detail)
      await this.zocUtil.genManufacturer(zip, time)
      await this.zocUtil.genPropertyCo(zip, time, propertyCo, detail)
      await this.zocUtil.genDevice(zip, time, detail, device)
      await this.zocUtil.upload(zip, time)
    }))
  }

  // 心跳包处理
  async upResidentToZOC(zone: string) {
    const time = moment().format('YYYYMMDDHHmmss');
    const zip = await this.zocUtil.genZip()
    const residents: IResident[] = await this.residentService.findByCondition({ zone, checkResult: 2, isDelete: false })
    const devices: IDevice[] = await this.deviceService.findByCondition({ zone })
    const deviceIds = devices.map(device => String(device.deviceId))
    const zoneDetail: IZone = await this.zoneService.findById(zone)
    const { detail } = zoneDetail
    const residentDatas: any = []
    await Promise.all(residents.map(async resident => {
      const user: IUser | null = await this.userService.updateById(resident.user, {})
      const address: IZone = await this.zoneService.findById(resident.address)

      if (!user) {
        return
      }
      let phone = user.phone
      if (!phone) {
        const owner: IUser | null = await this.userService.findById(resident.reviewer)
        if (!owner) {
          return
        }
        phone = owner.phone
      }
      const data = await this.zocUtil.genResidentData(address.profile, detail, user, deviceIds, phone)
      residentDatas.push(data)

    }))
    await this.zocUtil.genResident(zip, time, residentDatas)
    const data = await this.zocUtil.upload(zip, time)
    return data
  }

}

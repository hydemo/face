import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
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
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(StrangerService) private readonly strangerService: StrangerService,
    @Inject(QiniuUtil) private readonly qiniuUtil: QiniuUtil,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,

    private readonly mediaWs: MediaGateway,
  ) { }
  async callback(body: any) {
    const device: IDevice | null = await this.deviceService.findByUUID(body.DeviceUUID)
    if (!device) {
      return;
    }

    const img: string = await this.qiniuUtil.uploadB64(body.img)
    if (device.media && Number(body.WBMode) !== 1) {
      await this.mediaWs.sendMessage(String(device.media), { type: String(body.WBMode), imgUrl: img })
    }

    let imgex: any = null;
    if (body.imgex) {
      imgex = await this.qiniuUtil.uploadB64(body.imgex)
    }

    const { Attribute } = body
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
      passTime: body.CaptureTime,
      compareResult: body.CompareResult,
      faceQuality: body.FaceQuality,
      faceFeature: body.FaceFeature,
      imgUrl: img,
      imgexUrl: imgex,
      visitCount: body.VisitCount,
      attribute,
    }
    if (Number(body.WBMode) === 0) {
      await this.strangerService.create(stranger);
    } else {
      const userId: string = body.PicName.split('_')[1].replace('.jpg', '')
      const user: IUser | null = await this.userService.findById(userId)
      if (!user) {
        return
      }
      const orbit: CreateOrbitDTO = { user: user._id, mode: body.WBMode, ...stranger }
      const createOrbit: IOrbit = await this.orbitService.create(orbit);
      await this.sendMessage(createOrbit, user, device)
    }
    return
  }

  // 发送消息
  async sendMessage(orbit: IOrbit, user: IUser, device: IDevice) {
    const receivers: IReceiver[] = await this.receivers(user, device.zone)
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
      const application: ApplicationDTO = {
        first: {
          value: `您的${receiver.type === 'family' ? '家人' : '访客'}${user.username}${device.passType === 1 ? '进入' : '离开'}了${device.position.houseNumber}-${device.description}`,
          color: "#173177"
        },
        keyword1: {
          value: receiver.type === 'family' ? '家人' : '访客',
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
  async receivers(user: IUser, zone: string): Promise<IReceiver[]> {
    const receivers: IReceiver[] = []
    const residents: IResident[] = await this.residentService.findByCondition({
      isDelete: false, user: user._id, checkResult: 2
    });
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'visitor') {
        await this.visitorReceivers(resident, zone, receivers)
      } else if (resident.type === 'family' && resident.isMonitor) {
        await this.familyReceivers(resident, receivers)
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
    })
    return receivers
  }

  // 访客推送人
  async familyReceivers(resident: IResident, receivers: IReceiver[]): Promise<IReceiver[]> {
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
    return receivers
  }
  // 心跳包处理
  async keepalive(body: any) {

  }
}

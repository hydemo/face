import { Inject, Injectable } from '@nestjs/common';
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
  ) { }
  async callback(body: any) {
    const device: IDevice | null = await this.deviceService.findByUUID(body.DeviceUUID)
    if (!device) {
      return;
    }
    const img: string = await this.qiniuUtil.uploadB64(body.img)

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
      zone: device.zone,
      passTime: body.CaptureTime,
      compareResult: body.CompareResult,
      faceQuality: body.FaceQuality,
      faceFeature: body.FaceFeature,
      imgUrl: img,
      // imgexUrl: imgex,
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
      await this.sendMessage(createOrbit, user, device.zone)
    }
    return
  }

  // 发送消息
  async sendMessage(orbit: IOrbit, user: IUser, zone: string) {
    const receivers: string[] = await this.receivers(orbit, user, zone)
    return await Promise.all(receivers.map(async receiver => {
      const message: CreateOrbitMessageDTO = {
        sender: user._id,
        receiver,
        type: 'orbit',
        orbit: orbit._id
      }
      await this.messageService.createOrbitMessage(message)
    }))
  }

  // 发送消息
  async receivers(orbit: IOrbit, user: IUser, zone: string): Promise<string[]> {
    const receivers: string[] = []
    const residents: IResident[] = await this.residentService.findByCondition({
      isDelete: false, user: user._id, checkResult: 2
    });
    await Promise.all(residents.map(async resident => {
      if (resident.type === 'visitor') {
        await this.visitorReceivers(resident, zone, receivers)
      } else if (resident.type === 'family') {
        await this.familyReceivers(resident, receivers)
      }
    }))
    return receivers
  }

  // 访客推送人
  async visitorReceivers(resident: IResident, zone: string, receivers: string[]) {
    const residents: IResident[] = await this.residentService.findByCondition({
      zone,
      isDelete: false,
      isPush: true,
      address: resident.address,
      checkResult: 2
    })
    return residents.map(resid => receivers.push(resid.user))
  }

  // 访客推送人
  async familyReceivers(resident: IResident, receivers: string[]) {
    const residents: IResident[] = await this.residentService.findByCondition({
      isDelete: false,
      isPush: true,
      address: resident.address,
      checkResult: 2
    })
    return residents.map(resid => receivers.push(resid.user))
  }
}

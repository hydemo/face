import { Model } from 'mongoose';
import { Inject, Injectable, HttpException } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import * as md5 from 'md5'
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
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class CallbackService {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(OrbitService) private readonly orbitService: OrbitService,
    @Inject(StrangerService) private readonly strangerService: StrangerService,
    @Inject(QiniuUtil) private readonly qiniuUtil: QiniuUtil,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) { }
  async callback(body: any) {
    const device: IDevice | null = await this.deviceService.findByUUID(body.DeviceUUID)
    if (!device) {
      return;
    }
    const img: string = await this.qiniuUtil.uploadB64(body.img)
    // const imgex: string = await this.qiniuUtil.uploadB64(body.imgex)

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
      await this.orbitService.create(orbit);
    }
    return


    // const user = await this.userService.findById(body.userID)
    // const deviceUUID: string = 'umett6f28vij';
    // const timeStamp = Date.now();
    // const username = 'admin';
    // const password = 'oyxj19891024'
    // const sign = md5(`${deviceUUID}:${username}:${password}:${timeStamp}`)
    // const result = await axios({
    //   method: 'post',
    //   url: 'http://119.29.108.177:8011',
    //   data: {
    //     Name: 'WBListInfoREQ',
    //     TimeStamp: timeStamp,
    //     Sign: sign,
    //     Mode: 2,
    //     Action: 'GetList',
    //     UUID: deviceUUID,
    //   }
    // });
    // console.log(result.data.GetList.List, 'result')
  }


}

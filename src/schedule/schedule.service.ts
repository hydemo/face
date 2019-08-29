import * as Schedule from 'node-schedule';
import * as moment from 'moment';
import { RedisService } from 'nestjs-redis';
import { Injectable, Inject } from '@nestjs/common';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceService } from 'src/module/device/device.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { ResidentService } from 'src/module/resident/resident.service';
import { CameraUtil } from 'src/utils/camera.util';
import { FaceService } from 'src/module/face/face.service';
import { ApplicationDTO } from 'src/common/dto/Message.dto';
import { WeixinUtil } from 'src/utils/weixin.util';
import { RoleService } from 'src/module/role/role.service';
import { UserService } from 'src/module/users/user.service';
import { BlackService } from 'src/module/black/black.service';
import { IFace } from 'src/module/face/interfaces/face.interfaces';
import { IResident } from 'src/module/resident/interfaces/resident.interfaces';
import { IRole } from 'src/module/role/interfaces/role.interfaces';
import { IBlack } from 'src/module/black/interfaces/black.interfaces';
import { LogRecordService } from 'src/module/logRecord/logRecord.service';
import { SchoolService } from 'src/module/school/school.service';
import { ISchool } from 'src/module/school/interfaces/school.interfaces';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly redis: RedisService,
    @Inject(PhoneUtil) private readonly phone: PhoneUtil,
    @Inject(CameraUtil) private readonly camera: CameraUtil,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(ResidentService) private readonly residentService: ResidentService,
    @Inject(SchoolService) private readonly schoolService: SchoolService,
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(BlackService) private readonly blackService: BlackService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(FaceService) private readonly faceService: FaceService,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
    @Inject(LogRecordService) private readonly logService: LogRecordService,
  ) { }

  async getOpenId(face: IFace) {
    let openId;
    let type;
    switch (face.bondType) {
      case 'resident': {
        const resident: IResident | null = await this.residentService.findById(face.bondToObjectId)
        if (!resident) {
          return null
        }
        type = resident.type === 'owner' ? '业主' : resident.type === 'family' ? '家人' : '访客'
        const user = await this.userService.findById(resident.user)
        if (!user) {
          return null
        }
        if (!user.openId) {
          const review = await this.userService.findById(resident.reviewer)
          if (!review) {
            return null
          }
          openId = review.openId
          return { openId, type, isMe: false }
        }
        openId = user.openId;
        return { openId, type, isMe: true }
      }
      case 'role': {
        const role: IRole | null = await this.roleService.findById(face.bondToObjectId)
        if (!role) {
          return null
        }
        type = '物业人员'
        const user = await this.userService.findById(role.user)
        if (!user) {
          return null
        }
        if (!user.openId) {
          const review = await this.userService.findById(role.reviewer)
          if (!review) {
            return null
          }
          return { openId: review.openId, type }
        }
        return { openId: user.openId, type }
      }
      case 'black': {
        const black: IBlack | null = await this.blackService.findById(face.bondToObjectId)
        if (!black) {
          return null
        }
        type = '黑名单'
        const user = await this.userService.findById(black.applicant)
        if (!user) {
          return null
        }
        return { openId: user.openId, type }
      }
      default:
        break;
    }
    return ''
  }

  async sendP2PError(username, face: IFace, client) {
    const openId = await this.getOpenId(face)
    if (!openId) {
      return
    }
    const send = await client.get(openId.openId)
    if (send) {
      return
    }
    if (!send && openId) {
      const message: ApplicationDTO = {
        first: {
          value: `您提交的${username}的${openId.type}申请人脸检测失败`,
          color: "#173177"
        },
        keyword1: {
          value: '审核不通过',
          color: "#173177"
        },
        keyword2: {
          value: `${username}`,
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
          value: openId.isMe ? `请在实名认证页面重新上传头像` : `请在${openId.type}管理页面修改头像`,
          color: "#173177"
        },
      }
      this.weixinUtil.sendVerifyMessage(openId.openId, message)
      await client.set(openId.openId, 1, 'EX', 60 * 2)
    }
  }

  async handelP2P(data, sourceData, dataString, client, type) {
    const listenTime = await client.hget('p2p_listen', data.device)
    if (listenTime > 5) {
      await client.hset('p2p_listen', data.device, 0)
      return
    }
    if (listenTime > 0) {
      client.rpush(`p2p_${data.device}`, dataString)
      await client.hincrby('p2p_listen', data.device, 1)
      return;
    }
    if (!data.device) {
      return
    }
    let result: any
    await client.hset('p2p_listen', data.device, 1)
    if (data.type === 'add') {
      const faceExist = await this.faceService.findOne({
        user: data.face.user,
        device: data.face.device,
        isDelete: false,
        checkResult: 2,
      })
      if (faceExist) {
        result = {
          LibIndex: faceExist.libIndex,
          FlieIndex: faceExist.flieIndex,
          Pic: faceExist.pic,
        }
      } else {
        result = type === 'p2p' ? await this.camera.handleP2P(sourceData) : await this.camera.handleP2PEroor(sourceData)
      }
      if (result === 'imgError') {
        await this.faceService.updateById(data.face._id, { checkResult: 3 })
        await this.sendP2PError(data.username, data.face, client)
      } else if (result === 'success') {
        await this.faceService.updateById(data.face._id, { checkResult: 2 })
      } else if (result && result.Pic && data.version === '1.0.0') {
        const face = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
          checkResult: 2
        }
        await this.faceService.updateById(data.face._id, face)
      } else if (result === 'final') {
        await this.faceService.updateById(data.face._id, { checkResult: 3 })
      }
    } else if (data.type === 'delete') {
      let p2pData = data
      const faceExist: IFace | null = await this.faceService.findById(data.face._id)
      if (faceExist && data.version === '1.0.0') {
        const deleteData = data.data
        if (!deleteData.DeleteOnePic.Pic || !deleteData.DeleteOnePic.LibIndex || !deleteData.DeleteOnePic.FlieIndex) {
          const DeleteOnePic = {
            Pic: faceExist.pic,
            LibIndex: faceExist.libIndex,
            FlieIndex: faceExist.flieIndex,
          }
          p2pData = { ...data, data: { ...deleteData, DeleteOnePic } }
        }
      }
      const result = type === 'p2p' ? await this.camera.handleP2P(p2pData) : await this.camera.handleP2PEroor(sourceData)
      if (result === 'success') {
        await this.faceService.updateById(data.face._id, { checkResult: 2 })
      }

    } else if (data.type === 'update-add') {
      result = type === 'p2p' ? await this.camera.handleP2P(sourceData) : await this.camera.handleP2PEroor(sourceData)
      if (result === 'imgError') {
        await this.faceService.updateById(data.face[0]._id, { checkResult: 3 })
        await this.sendP2PError(data.username, data.face[0], client)
      } else if (result && result.Pic) {
        const update = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
          checkResult: 2
        }
        await Promise.all(data.face.map(async face => {
          await this.faceService.updateById(face._id, update)
        }))
      } else if (result === 'final') {
        await Promise.all(data.face.map(async face => {
          await this.faceService.updateById(face._id, { checkResult: 3 })
        }))
      }
    } else if (data.type === 'update-delete') {
      const faceExist: any = await this.faceService.findById(data.face[0]._id)
      await this.residentService.updateByUser(faceExist.user)
      type === 'p2p' ? await this.camera.handleP2P(sourceData) : await this.camera.handleP2PEroor(sourceData)
    } else if (data.type === 'update') {
      const faceExist: any = await this.faceService.findById(data.face[0]._id)
      let result: any = true
      if (faceExist) {
        await this.residentService.updateByUser(faceExist.user)
        result = type === 'p2p' ? await this.camera.handleP2P(sourceData) : await this.camera.handleP2PEroor(sourceData)
      }
      if (result === 'imgError') {
        await this.faceService.updateById(data.face[0]._id, { checkResult: 3 })
        await this.sendP2PError(data.username, data.face[0], client)
      } else if (result === 'success') {
        await Promise.all(data.face.map(async face => {
          await this.faceService.updateById(face._id, { checkResult: 2 })
        }))
      } else if (result === 'final') {
        await Promise.all(data.face.map(async face => {
          await this.faceService.updateById(face._id, { checkResult: 3 })
        }))
      }
    }
    return await client.hset('p2p_listen', data.device, 0)
  }

  async enableSchedule() {
    const rule = new Schedule.RecurrenceRule();
    rule.second = 0;
    rule.minute = 0;
    rule.hour = 3;

    const logRule = new Schedule.RecurrenceRule();
    logRule.second = 0;
    logRule.minute = 0;
    logRule.hour = 0;

    Schedule.scheduleJob(rule, async () => {
      await this.residentService.removeVisitor()
      await this.schoolService.removeVisitor()
    });

    Schedule.scheduleJob(logRule, async () => {
      await this.logService.genLog()
    });

    Schedule.scheduleJob('*/2 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        await client.hincrby('device', key, 1)
      }))
    });

    Schedule.scheduleJob('*/16 * * * * *', async () => {
      const client = this.redis.getClient()
      const pools = await client.hkeys('p2p_pool')
      await Promise.all(pools.map(async  pool => {
        const length = await client.llen(`p2p_${pool}`)
        if (!length) {
          await client.hdel('p2p_pool', pool)
          return
        }
        const device: IDevice = await this.deviceService.findById(pool)
        if (!device) {
          await client.hdel('p2p_pool', pool)
          return
        }

        const alive = await client.hget('device', device.deviceUUID)
        if (!alive || Number(alive) > 4) {
          await client.hdel('p2p_pool', pool)
          return
        }
        const dataString: any = await client.rpop(`p2p_${pool}`)
        const data = JSON.parse(dataString)
        await this.handelP2P(data, data, dataString, client, 'p2p')
      }))
    });

    Schedule.scheduleJob('*/30 * * * * *', async () => {
      const client = this.redis.getClient()
      const pools = await client.hkeys('p2pError_pool')
      await Promise.all(pools.map(async  pool => {
        const length = await client.llen(`p2pError_${pool}`)
        if (!length) {
          await client.hdel('p2pError_pool', pool)
          return
        }
        const device: IDevice = await this.deviceService.findById(pool)
        if (!device) {
          await client.hdel('p2pError_pool', pool)
          return
        }
        const alive = await client.hget('device', device.deviceUUID)
        if (!alive || Number(alive) > 4) {
          await client.hdel('p2pError_pool', pool)
          return
        }
        const dataString: any = await client.rpop(`p2pError_${pool}`)
        const errorData = JSON.parse(dataString)
        const { upData } = errorData
        await this.handelP2P(upData, errorData, dataString, client, 'p2pError')
      }))


    });

    Schedule.scheduleJob('*/5 * * * * *', async () => {
      const residents: IResident[] = await this.residentService.findByCondition({ checkResult: { $in: [4, 5] }, isDelete: false })
      const roles: IRole[] = await this.roleService.findByCondition({ checkResult: { $in: [4, 5] }, isDelete: false })
      const blacks: IBlack[] = await this.blackService.findByCondition({ checkResult: { $in: [4, 5] }, isDelete: false })
      const schools: ISchool[] = await this.schoolService.findByCondition({ checkResult: { $in: [4, 5] }, isDelete: false })
      await Promise.all(residents.map(async resident => {
        const checkResult = await this.faceService.checkResult(resident._id)
        return await this.residentService.updateById(resident._id, { checkResult });

      }))
      await Promise.all(roles.map(async role => {
        const checkResult = await this.faceService.checkResult(role._id)
        return await this.roleService.updateById(role._id, { checkResult });
      }))
      await Promise.all(blacks.map(async black => {
        const checkResult = await this.faceService.checkResult(black._id)
        return await this.blackService.updateById(black._id, { checkResult });

      }))
      await Promise.all(schools.map(async school => {
        const checkResult = await this.faceService.checkResult(school._id)
        return await this.schoolService.updateById(school._id, { checkResult });

      })
      )
    });

    Schedule.scheduleJob('*/2 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        await client.hincrby('device', key, 1)
      }))
    });



    Schedule.scheduleJob('*/30 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        const value = await client.hget('device', key)
        if (Number(value) > 10) {
          await client.hdel('device', key)
          const device: IDevice | null = await this.deviceService.findByUUID(key)
          if (!device) return
          const zoneName = device.position.houseNumber.split('-')
          await this.phone.sendDeviceError(zoneName[0], key)
        }
      }))
    });

    // Schedule.scheduleJob('*/15 * * * * * ', async () => {
    //   const client = this.redis.getClient()
    //   const devices = await client.hkeys('copy')
    //   await Promise.all(devices.map(async device => {
    //     const listenTime = await client.hget('p2p_listen', String(device))
    //     if (Number(listenTime) > 0) {
    //       return;
    //     }
    //     await client.hset('p2p_listen', device, 1)
    //     const keys = await client.hkeys(`copy_${device}`)
    //     if (keys.length) {
    //       const userId = keys[0]
    //       const user = await this.userService.findById(userId)
    //       if (!user) {
    //         return
    //       }
    //       const img = await this.camera.getImg(`${user.faceUrl}`);
    //       const result = await this.camera.addToDevice(device, user, img)
    //       if (result === 'imgError') {
    //         await client.hset(`copyImgError_${device}`, user._id, user.faceUrl)
    //         await client.hdel(`copy_${device}`, userId)

    //       }
    //       if (result === 'success') {
    //         await this.faceService.success(userId, device._id, result)
    //         await client.hdel(`copy_${device}`, userId)
    //       }
    //       if (result === 'exist') {
    //         await client.hset(`copyExist_${device}`, user._id, user.faceUrl)
    //         await client.hdel(`copy_${device}`, userId)
    //       }
    //       await client.hset('p2p_listen', device, 0)
    //     }
    //   }))
    // });
  }
}
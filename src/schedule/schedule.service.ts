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

  sleep = function (delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(1)
        } catch (e) {
          reject(0)
        }
      }, delay);
    })
  }

  async getOpenId(face: IFace) {
    let openId;
    let type;
    let username;
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
        username = user.username;
        return { openId, type, isMe: true, username }
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
          return { openId: review.openId, type, username: user.username }
        }
        return { openId: user.openId, type, username: user.username }
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
        return { openId: user.openId, type, username: user.username }
      }
      default:
        break;
    }
    return ''
  }

  async sendImgError(faceId: string, client) {
    const face = await this.faceService.findById(faceId)
    if (!face) {
      return
    }
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
          value: `您提交的${openId.username}的${openId.type}申请人脸检测失败`,
          color: "#173177"
        },
        keyword1: {
          value: '审核不通过',
          color: "#173177"
        },
        keyword2: {
          value: `${openId.username}`,
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
  async handResult(res, data, pool, client) {
    console.log('result!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', pool, res)
    await client.hset('p2p_listen', pool, 0)
    let result = res
    const { imgUrl } = data
    if (res === 'noExist') {
      const newData = { ...data, type: 'add' }
      const poolExist = await client.hget('p2p_pool', pool)
      if (!poolExist) {
        await client.hset('p2p_pool', pool, 1)
      }
      client.rpush(`p2p_${pool}`, JSON.stringify(newData))
    }
    if (res === 'error') {

      const errorData = { ...data, count: data.count + 1 }
      const poolExist = await client.hget('p2pError_pool', pool)
      if (!poolExist) {
        await client.hset('p2pError_pool', pool, 1)
      }
      await client.lpush(`p2pError_${pool}`, JSON.stringify(errorData))
    }
    if (result === 'imgError') {
      // await this.sendImgError(data.face, client)
      await Promise.all(data.faces.map(async id => {
        await this.faceService.updateById(id, { checkResult: 3 })
      }))
      await client.hincrby('img', imgUrl, -1)
    } else if (result === 'success') {
      await Promise.all(data.faces.map(async id => {
        await this.faceService.updateById(id, { checkResult: 2 })
      }))
      await client.hincrby('img', imgUrl, -1)
    } else if (result && result.Pic) {
      const update = {
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.Pic,
        checkResult: 2
      }
      await Promise.all(data.faces.map(async id => {
        await this.faceService.updateById(id, update)
      }))
      await client.hincrby('img', imgUrl, -1)
    } else if (result === 'final') {
      await Promise.all(data.faces.map(async id => {
        await this.faceService.updateById(id, { checkResult: 3 })
      }))
      await client.hincrby('img', imgUrl, -1)
    }
  }


  async handelP2P(data, device: IDevice, pool, client) {
    let result
    switch (data.type) {
      case 'add': {
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
          result = await this.camera.addOnePic(data, device)
        }
        await this.handResult(result, data, pool, client)
      }
        break;
      case 'delete': {
        let deleteData = data
        const faceExist: IFace | null = await this.faceService.findById(data.face._id)
        if (faceExist && device.version === '1.0.0') {
          if (!data.Pic || !data.LibIndex || !data.FlieIndex) {
            deleteData = {
              ...data,
              Pic: faceExist.pic,
              LibIndex: faceExist.libIndex,
              FlieIndex: faceExist.flieIndex,
            }
          }
        }
        result = await this.camera.deleteOnePic(deleteData, device)
        await this.handResult(result, data, pool, client)
      }
        break;
      case 'update': {
        const faceExist: any = await this.faceService.findById(data.face)
        if (!faceExist) {
          return
        }
        result = await this.camera.updateOnePic(data, device)
        await this.handResult(result, data, pool, client)
      }
        break;
      case 'update-add': {
        result = await this.camera.addOnePic(data, device)
        await this.handResult(result, data, pool, client)
      }
        break;
      case 'update-delete': {
        const faceCheck = await this.faceService.findById(data.face)
        if (faceCheck && faceCheck.checkResult === 1) {
          result = await this.camera.deleteOnePic(data, device)
          await this.handResult(result, data, pool, client)
        }
      }
        break;

      default:
        break;
    }
  }

  async enableSchedule() {
    const rule = new Schedule.RecurrenceRule();
    rule.second = 0;
    rule.minute = 0;
    rule.hour = 3;

    const logRule = new Schedule.RecurrenceRule();
    logRule.second = 0;
    logRule.minute = 1;
    logRule.hour = 0;

    Schedule.scheduleJob(rule, async () => {
      await this.residentService.removeVisitor()
      await this.schoolService.removeVisitor()
    });

    Schedule.scheduleJob(logRule, async () => {
      await this.logService.genLog()
    });

    Schedule.scheduleJob('*/5 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        await client.hincrby('device', key, 1)
      }))
    });

    Schedule.scheduleJob('*/20 * * * * *', async () => {
      const client = this.redis.getClient()
      const pools = await client.hkeys('p2p_pool')
      for (let pool of pools) {
        await this.sleep(1000)
        const length = await client.llen(`p2p_${pool}`)
        if (!length) {
          await client.hdel('p2p_pool', pool)
          continue
        }
        const device: IDevice = await this.deviceService.findById(pool)
        if (!device || !device.enable) {
          await client.hdel('p2p_pool', pool)
          continue
        }

        const alive = await client.hget('device', device.deviceUUID)
        if (!alive || Number(alive) > 4) {
          await client.hdel('p2p_pool', pool)
          continue
        }
        const dataString: any = await client.rpop(`p2p_${pool}`)
        if (!dataString) {
          continue
        }
        const listenTime = await client.hget('p2p_listen', pool)
        if (listenTime && Number(listenTime) > 4) {
          await client.hset('p2p_listen', pool, 0)
          continue
        }
        if (listenTime && Number(listenTime) > 0) {
          await client.rpush(`p2p_${pool}`, dataString)
          await client.hincrby('p2p_listen', pool, 1)
          continue;
        }
        const data = JSON.parse(dataString)
        await client.hset('p2p_listen', pool, 1)
        console.log('start::::::::::::::', pool)
        this.handelP2P(data, device, pool, client)
      }
    });

    Schedule.scheduleJob('*/37 * * * * *', async () => {
      const client = this.redis.getClient()
      const pools = await client.hkeys('p2pError_pool')
      for (let pool of pools) {
        const length = await client.llen(`p2pError_${pool}`)
        if (!length) {
          await client.hdel('p2pError_pool', pool)
          continue
        }
        const device: IDevice = await this.deviceService.findById(pool)
        if (!device || !device.enable) {
          await client.hdel('p2pError_pool', pool)
          continue
        }
        const alive = await client.hget('device', device.deviceUUID)
        if (!alive || Number(alive) > 4) {
          await client.hdel('p2pError_pool', pool)
          continue
        }
        const dataString: any = await client.rpop(`p2pError_${pool}`)
        if (!dataString) {
          continue
        }
        const listenTime = await client.hget('p2p_listen', pool)
        if (listenTime && Number(listenTime) > 5) {
          await client.hset('p2p_listen', pool, 0)
          continue
        }
        if (listenTime && Number(listenTime) > 0) {
          await client.rpush(`p2pError_${pool}`, dataString)
          await client.hincrby('p2p_listen', pool, 1)
          continue;
        }
        const data = JSON.parse(dataString)
        await this.sleep(2000)
        await client.hset('p2p_listen', pool, 1)
        console.log('start error::::::::::::::', pool)
        this.handelP2P(data, device, pool, client)
      }


    });

    // 状态确认
    Schedule.scheduleJob('*/5 * * * * *', async () => {
      const client = this.redis.getClient()
      const pendingResidents = await client.hkeys('pending_resident')
      const pendingRoles = await client.hkeys('pending_role')
      const pendingSchools = await client.hkeys('pending_school')
      const pendingBlacks = await client.hkeys('pending_black')

      const imgs = await client.hkeys('img')

      await Promise.all(imgs.map(async key => {
        const count = await client.hget('img', key)
        if (Number(count) < 1) {
          await client.hdel('imgBase64', key)
          await client.hdel('img', key)
        }
      }))

      await Promise.all(pendingResidents.map(async id => {
        await this.residentService.updateById(id, { checkResult: 4 });
        await client.hdel('pending_resident', id)
      }))
      await Promise.all(pendingRoles.map(async id => {
        await this.roleService.updateById(id, { checkResult: 4 });
        await client.hdel('pending_role', id)
      }))
      await Promise.all(pendingSchools.map(async id => {
        await this.schoolService.updateById(id, { checkResult: 4 });
        await client.hdel('pending_school', id)
      }))
      await Promise.all(pendingBlacks.map(async id => {
        await this.blackService.updateById(id, { checkResult: 4 });
        await client.hdel('pending_black', id)
      }))

      const residents: IResident[] = await this.residentService.findByCondition({ checkResult: { $in: [4, 5] } })
      const roles: IRole[] = await this.roleService.findByCondition({ checkResult: { $in: [4, 5] } })
      const blacks: IBlack[] = await this.blackService.findByCondition({ checkResult: { $in: [4, 5] } })
      const schools: ISchool[] = await this.schoolService.findByCondition({ checkResult: { $in: [4, 5] } })
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

    // 设备异常报警
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
    //   console.log(devices, 'devices')
    //   await Promise.all(devices.map(async device => {
    //     // const listenTime = await client.hget('p2p_listen', String(device))
    //     // if (Number(listenTime) > 0) {
    //     //   return;
    //     // }
    //     const newDevice = await this.deviceService.findByUUID(device)
    //     if (!newDevice) {
    //       return
    //     }
    //     const listenTime = await client.hget('p2p_listen', device)
    //     if (listenTime && Number(listenTime) > 5) {
    //       await client.hset('p2p_listen', device, 0)
    //       return
    //     }
    //     if (Number(listenTime) > 0) {
    //       await client.hincrby('p2p_listen', device, 1)
    //       return;
    //     }
    //     await client.hset('p2p_listen', device, 1)
    //     const keys = await client.hkeys(`copy_${device}`)
    //     if (!keys.length) {
    //       console.log('111')
    //     }
    //     if (keys.length) {
    //       const userId = keys[0]
    //       // const errorCount = await client.hget(`copy_${device}`, userId)
    //       // if (Number(errorCount) > 8) {
    //       //   await client.hset(`copyFinal_${device}`, userId, 1)
    //       //   await client.hdel(`copyFinal_${device}`, userId)
    //       // }
    //       const user = await this.userService.findById(userId)
    //       if (!user) {
    //         return
    //       }
    //       const result = await this.camera.addToDevice(device, user)
    //       console.log(result, 'result')
    //       if (result === 'imgError') {
    //         await client.hset(`copyImgError_${device}`, user._id, user.faceUrl)
    //         await this.faceService.updateByCondition({ user: userId, device: newDevice._id, isDelete: false }, { checkResult: 3 })
    //         await client.hdel(`copy_${device}`, userId)
    //       }
    //       if (result === 'success') {
    //         // await this.faceService.updateByCondition({ user: userId, device: newDevice._id, isDelete: false }, { checkResult: 2 })
    //         await client.hdel(`copy_${device}`, userId)
    //       }
    //       if (result === 'error') {
    //         await client.hincrby(`copy_${device}`, userId, 1)
    //       }
    //       if (result === 'final') {
    //         await client.hset(`copyFinal_${device}`, userId, 1)
    //         await client.hdel(`copy_${device}`, userId)
    //       }
    //       await client.hset('p2p_listen', device, 0)
    //     }
    //   }))
    // });
  }
}
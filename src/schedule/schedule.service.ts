import * as Schedule from 'node-schedule';
import { RedisService } from 'nestjs-redis';
import { Injectable, Inject } from '@nestjs/common';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceService } from 'src/module/device/device.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { ResidentService } from 'src/module/resident/resident.service';
import { CameraUtil } from 'src/utils/camera.util';
import { FaceService } from 'src/module/face/face.service';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly redis: RedisService,
    @Inject(PhoneUtil) private readonly phone: PhoneUtil,
    @Inject(CameraUtil) private readonly camera: CameraUtil,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(ResidentService) private readonly residentService: ResidentService,
    @Inject(FaceService) private readonly faceService: FaceService,
  ) { }

  async handelP2P(data, dataString, client, type) {
    const isUpload = await client.hget('p2p_listen', data.device)
    if (isUpload === 'loading') {
      client.rpush(type, dataString)
      return;
    }
    if (!data.device) {
      return
    }
    let result: any
    await client.hset('p2p_listen', data.device, 'loading')
    if (data.type === 'add') {
      const faceExist = await this.faceService.findOne({
        user: data.face.user,
        device: data.face.device,
        isDelete: false,
      })
      if (faceExist) {
        result = {
          LibIndex: faceExist.libIndex,
          FlieIndex: faceExist.flieIndex,
          Pic: faceExist.pic,
        }
      } else {
        result = await this.camera.handleP2P(data)
      }
      if (result) {
        const face = {
          ...data.face,
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await this.faceService.create(face)
      }
    } else if (data.type === 'delete') {
      const faceExist = await this.faceService.findById(data.face._id)
      if (faceExist && !faceExist.isDelete) {
        await this.camera.handleP2P(data)
        await this.faceService.updateById(data.face._id, { isDelete: true })
      }
    } else if (data.type === 'update') {
      result = await this.camera.handleP2P(data)
      if (result) {
        const update = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await Promise.all(data.faces.map(async face => {
          await this.faceService.updateById(face._id, update)
        }))
      }
    } else if (data.type === 'update-delete') {
      await this.camera.handleP2P(data)
      await Promise.all(data.faces.map(async face => {
        await this.faceService.updateById(face._id, { isDelete: true })
      }))
    }
    return await client.hset('p2p_listen', data.device, 'loaded')
  }

  async enableSchedule() {
    const rule = new Schedule.RecurrenceRule();
    rule.second = 0;
    rule.minute = 0;
    rule.hour = 3;

    Schedule.scheduleJob(rule, async () => {
      await this.residentService.removeVisitor()
    });

    Schedule.scheduleJob('*/2 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        await client.hincrby('device', key, 1)
      }))
    });

    Schedule.scheduleJob('*/8 * * * * *', async () => {
      const client = this.redis.getClient()
      const length = await client.llen('p2p')
      if (!length) {
        return
      }
      const dataString: any = await client.rpop('p2p')
      const data = JSON.parse(dataString)
      console.log(data, 'data')
      await this.handelP2P(data, dataString, client, 'p2p')
    });

    Schedule.scheduleJob('*/10 * * * * *', async () => {
      const client = this.redis.getClient()
      const length = await client.llen('p2pError')
      if (!length) {
        return
      }
      const dataString: any = await client.rpop('p2pError')
      const errorData = JSON.parse(dataString)
      const { upData } = errorData
      await this.handelP2P(upData, dataString, client, 'p2pError')
    });

    // Schedule.scheduleJob('*/1 * * * *', async () => {
    //   const client = this.redis.getClient()
    //   const keys = await client.hkeys('device')
    //   await Promise.all(keys.map(async key => {
    //     await client.hincrby('device', key, 1)
    //   }))
    // });



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
  }
}
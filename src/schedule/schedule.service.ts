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
      const dataString: any = await client.lpop('p2p')
      const data = JSON.parse(dataString)
      const result = await this.camera.handleP2P(data)
      if (!result) {
        return
      }
      if (data.type === 'add') {
        const face = {
          ...data.face,
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await this.faceService.create(face)
      } else if (data.type === 'delete') {
        await this.faceService.updateById(data.face._id, { isDelete: true })
      } else if (data.type === 'update') {
        const update = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await Promise.all(data.faces.map(async face => {
          return await this.faceService.updateById(face._id, update)
        }))
      } else if (data.type === 'update-delete') {
        await Promise.all(data.faces.map(async face => {
          return await this.faceService.updateById(face._id, { isDelete: true })
        }))
      }
      return
    });

    Schedule.scheduleJob('*/10 * * * * *', async () => {
      const client = this.redis.getClient()
      const length = await client.llen('p2pError')
      if (!length) {
        return
      }
      const dataString: any = await client.lpop('p2pError')
      const errorData = JSON.parse(dataString)
      const { upData } = errorData
      const result = await this.camera.handleP2PEroor(errorData)
      if (!result) {
        return
      }
      if (upData.type === 'add') {
        const face = {
          ...upData.face,
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await this.faceService.create(face)
      } else if (upData.type === 'delete') {
        await this.faceService.updateById(upData.face._id, { isDelete: true })
      } else if (upData.type === 'update-add') {
        const update = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        await Promise.all(upData.faces.map(async face => {
          return await this.faceService.updateById(face._id, update)
        }))
      } else if (upData.type === 'update-delete') {
        await Promise.all(upData.faces.map(async face => {
          return await this.faceService.updateById(face._id, { isDelete: true })
        }))
      }
      return
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
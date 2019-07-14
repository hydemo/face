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

    Schedule.scheduleJob('*/5 * * * * *', async () => {
      console.log('开始上传。。。。。')
      const client = this.redis.getClient()
      const data: any = await client.lpop('p2p')
      const result = await this.camera.handleP2p(JSON.parse(data))
      if (!result) {
        return
      }
      console.log('上传成功。。。。。')
      const face = {
        ...data.face,
        libIndex: result.LibIndex,
        flieIndex: result.FlieIndex,
        pic: result.Pic,
      }
      if (face._id) {
        const update = {
          libIndex: result.LibIndex,
          flieIndex: result.FlieIndex,
          pic: result.Pic,
        }
        return await this.faceService.updateById(face._id, update)
      }
      await this.faceService.create(face)
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
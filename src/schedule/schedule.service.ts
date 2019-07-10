import * as Schedule from 'node-schedule';
import { RedisService } from 'nestjs-redis';
import { Injectable, Inject } from '@nestjs/common';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceService } from 'src/module/device/device.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { ResidentService } from 'src/module/resident/resident.service';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly redis: RedisService,
    @Inject(PhoneUtil) private readonly phone: PhoneUtil,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(ResidentService) private readonly residentService: ResidentService,
  ) { }

  async enableSchedule() {
    const rule = new Schedule.RecurrenceRule();
    rule.second = 0;
    rule.minute = 0;
    rule.hour = 0;

    Schedule.scheduleJob(rule, async () => {
      await this.residentService.removeVisitor()
    });

    Schedule.scheduleJob('*/30 * * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      await Promise.all(keys.map(async key => {
        await client.hincrby('device', key, 1)
      }))
    });

    Schedule.scheduleJob('* */5 * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      console.log(keys)
      await Promise.all(keys.map(async key => {
        const value = await client.hget('device', key)
        if (Number(value) > 10) {

          const device: IDevice | null = await this.deviceService.findByUUID(key)
          console.log(device)
          if (!device) return
          const zoneName = device.position.houseNumber.split('-')
          await this.phone.sendDeviceError(zoneName[0], key)
        }
      }))
    });
  }
}
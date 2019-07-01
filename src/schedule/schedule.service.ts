import * as Schedule from 'node-schedule';
import { RedisService } from 'nestjs-redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly redis: RedisService,
  ) { }

  async enableSchedule() {
    // const rule = new Schedule.RecurrenceRule();
    // rule.second = 30;
    Schedule.scheduleJob('/30 * * * * *', async () => {
      const client = this.redis.getClient()
      const keys = await client.hkeys('device')
      console.log(keys, 'keys')
    });
  }
}
import * as Schedule from 'node-schedule';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScheduleService {
  constructor(
  ) { }

  async enableSchedule() {
    const rule = new Schedule.RecurrenceRule();
    rule.second = 0;
    rule.minute = 48;
    rule.hour = 15;
    Schedule.scheduleJob(rule, () => {
    });
  }
}
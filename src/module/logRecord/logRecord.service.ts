import { Model } from 'mongoose';
import * as moment from 'moment';
import { Inject, Injectable } from '@nestjs/common';
import { ILogRecord, IUploadRecord, IUserRecord } from './interfaces/logRecord.interfaces';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from 'src/config/config.service';
import { UserService } from '../users/user.service';
import { ResidentService } from '../resident/resident.service';

@Injectable()
export class LogRecordService {
  constructor(
    @Inject('LogRecordModelToken') private readonly logRecordModel: Model<ILogRecord>,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ResidentService) private readonly residentService: ResidentService,
    private redis: RedisService,
    private config: ConfigService,
  ) { }
  // 根据类型获取条件
  getCondition(type: string) {
    if (type === 'week') {
      const end = moment().add(-1, 'd').format('YYYY-MM-DD')
      const start = moment().add(-1, 'week').format('YYYY-MM-DD')
      return { date: { $gte: start, $lte: end } }
    } else {
      const end = moment().add(-1, 'd').format('YYYY-MM-DD')
      const start = moment().add(-1, 'M').format('YYYY-MM-DD')
      return { date: { $gte: start, $lte: end } }
    }
  }
  //获取当天数据
  async getUploadRecordToday(): Promise<IUploadRecord> {
    const date = moment().format('YYYY-MM-DD')
    const preDate = moment().add(-1, 'd').format('YYYY-MM-DD')
    const preLog: ILogRecord | null = await this.logRecordModel.findOne({ date: preDate })
    const client = this.redis.getClient()
    const socCount = Number(await client.hget(this.config.LOG, this.config.LOG_SOC))
    const residentCount = Number(await client.hget(this.config.LOG, this.config.LOG_RESIDENT))
    const enRecordCount = Number(await client.hget(this.config.LOG, this.config.LOG_ENRECORD))
    const propertyCoCount = Number(await client.hget(this.config.LOG, this.config.LOG_PROPERTYCO))
    const deviceCount = Number(await client.hget(this.config.LOG, this.config.LOG_DEVICE))
    const data: IUploadRecord = {
      date,
      socCount,
      socTotal: preLog ? preLog.socTotal ? preLog.socTotal + socCount : socCount : socCount,
      residentCount,
      residentTotal: preLog ? preLog.residentTotal + residentCount : residentCount,
      enRecordCount,
      propertyCoCount,
      propertyCoTotal: preLog ? propertyCoCount + preLog.propertyCoTotal : enRecordCount,
      enRecordTotal: preLog ? preLog.enRecordTotal + enRecordCount : enRecordCount,
      deviceCount,
      deviceTotal: preLog ? preLog.deviceTotal + deviceCount : deviceCount,
    }
    return data;
  }
  // 初始化缓存参数
  async initData() {
    const client = this.redis.getClient()
    const userExist = await client.hget(this.config.LOG, this.config.LOG_USER)
    const totalExist = await client.hget(this.config.LOG, this.config.LOG_TOTAL)
    const socExist = await client.hget(this.config.LOG, this.config.LOG_SOC)
    const residentExist = await client.hget(this.config.LOG, this.config.LOG_RESIDENT)
    const enRecordExist = await client.hget(this.config.LOG, this.config.LOG_ENRECORD)
    const propertyCoExist = await client.hget(this.config.LOG, this.config.LOG_PROPERTYCO)
    const deviceExist = await client.hget(this.config.LOG, this.config.LOG_DEVICE)
    const verifyExist = await client.hget(this.config.LOG, this.config.LOG_VERIFY)
    const blackExist = await client.hget(this.config.LOG, this.config.LOG_BLACK)
    const openExist = await client.hget(this.config.LOG, this.config.LOG_OPEN)
    const ownerExist = await client.hget(this.config.LOG, this.config.LOG_OWNER)
    if (!userExist) {
      const userCount = await this.userService.count({ isPhoneVerify: true })
      await client.hset(this.config.LOG, this.config.LOG_USER, userCount)
    }
    if (!totalExist) {
      await client.hset(this.config.LOG, this.config.LOG_TOTAL, 0)
    }
    if (!socExist) {
      await client.hset(this.config.LOG, this.config.LOG_SOC, 0)
    }
    if (!residentExist) {
      await client.hset(this.config.LOG, this.config.LOG_RESIDENT, 0)
    }
    if (!enRecordExist) {
      await client.hset(this.config.LOG, this.config.LOG_ENRECORD, 0)
    }
    if (!propertyCoExist) {
      await client.hset(this.config.LOG, this.config.LOG_PROPERTYCO, 1)
    }
    if (!deviceExist) {
      await client.hset(this.config.LOG, this.config.LOG_DEVICE, 6)
    }
    if (!verifyExist) {
      const verifyCount = await this.userService.count({ isVerify: true })
      await client.hset(this.config.LOG, this.config.LOG_VERIFY, verifyCount)
    }
    if (!blackExist) {
      await client.hset(this.config.LOG, this.config.LOG_BLACK, 0)
    }
    if (!openExist) {
      await client.hset(this.config.LOG, this.config.LOG_OPEN, 0)
    }
    if (!ownerExist) {
      const ownerCount = await this.residentService.count({ type: 'owner', isDelete: false })
      await client.hset(this.config.LOG, this.config.LOG_OWNER, ownerCount)
    }
  }

  //获取当天数据
  async getUserRecordToday(): Promise<IUserRecord> {
    const date = moment().format('YYYY-MM-DD')
    const preDate = moment().add(-1, 'd').format('YYYY-MM-DD')
    const preLog: ILogRecord | null = await this.logRecordModel.findOne({ date: preDate })
    const client = this.redis.getClient()
    const userCount = Number(await client.hget(this.config.LOG, this.config.LOG_USER))
    const ips: string[] = await client.hkeys(this.config.LOG_IP)
    const ipCount = ips.length
    const totalCount = Number(await client.hget(this.config.LOG, this.config.LOG_TOTAL))
    const verifyCount = Number(await client.hget(this.config.LOG, this.config.LOG_VERIFY))
    const blackCount = Number(await client.hget(this.config.LOG, this.config.LOG_BLACK))
    const openCount = Number(await client.hget(this.config.LOG, this.config.LOG_OPEN))
    const ownerCount = Number(await client.hget(this.config.LOG, this.config.LOG_OWNER))
    const data: IUserRecord = {
      date,
      userCount,
      userTotal: preLog ? preLog.userTotal + userCount : userCount,
      ipCount,
      totalCount,
      verifyCount,
      verifyTotal: preLog ? preLog.verifyTotal + verifyCount : verifyCount,
      blackCount,
      blackTotal: preLog ? preLog.blackTotal + blackCount : blackCount,
      openCount,
      openTotal: preLog ? preLog.openTotal + openCount : openCount,
      ownerCount,
      ownerTotal: preLog ? preLog.ownerTotal + ownerCount : ownerCount,
    }
    return data;
  }
  // 生成当天数据
  async genLog() {
    const preDate = moment().add(-1, 'd').format('YYYY-MM-DD')
    const preLog: ILogRecord | null = await this.logRecordModel.findOne({ date: preDate })
    const client = this.redis.getClient()
    const userCount = Number(await client.hget(this.config.LOG, this.config.LOG_USER))
    const ips: string[] = await client.hkeys(this.config.LOG_IP)
    const ipCount = ips.length
    const totalCount = Number(await client.hget(this.config.LOG, this.config.LOG_TOTAL))
    const socCount = Number(await client.hget(this.config.LOG, this.config.LOG_SOC))
    const residentCount = Number(await client.hget(this.config.LOG, this.config.LOG_RESIDENT))
    const enRecordCount = Number(await client.hget(this.config.LOG, this.config.LOG_ENRECORD))
    const propertyCoCount = Number(await client.hget(this.config.LOG, this.config.LOG_PROPERTYCO))
    const deviceCount = Number(await client.hget(this.config.LOG, this.config.LOG_DEVICE))
    const verifyCount = Number(await client.hget(this.config.LOG, this.config.LOG_VERIFY))
    const blackCount = Number(await client.hget(this.config.LOG, this.config.LOG_BLACK))
    const openCount = Number(await client.hget(this.config.LOG, this.config.LOG_OPEN))
    const ownerCount = Number(await client.hget(this.config.LOG, this.config.LOG_OWNER))
    await client.hset(this.config.LOG, this.config.LOG_USER, 0)
    await client.hset(this.config.LOG, this.config.LOG_SOC, 0)
    await client.hset(this.config.LOG, this.config.LOG_TOTAL, 0)
    await client.hset(this.config.LOG, this.config.LOG_RESIDENT, 0)
    await client.hset(this.config.LOG, this.config.LOG_ENRECORD, 0)
    await client.hset(this.config.LOG, this.config.LOG_DEVICE, 0)
    await client.hset(this.config.LOG, this.config.LOG_VERIFY, 0)
    await client.hset(this.config.LOG, this.config.LOG_BLACK, 0)
    await client.hset(this.config.LOG, this.config.LOG_OPEN, 0)
    await client.hset(this.config.LOG, this.config.LOG_OWNER, 0)
    await client.del(this.config.LOG_IP)
    const log = {
      // 日期
      date: preDate,
      // 用户增长量
      userCount,
      // 总用户数
      userTotal: preLog ? userCount + preLog.userTotal : userCount,
      // 独立ip数
      ipCount,
      // 总访问量
      totalCount,
      // 一标三实
      socCount,
      // 一标三实总量
      socTotal: preLog ? socCount + preLog.socTotal : socCount,
      // 住户上传数
      residentCount,
      // 住户信息上报总量
      residentTotal: preLog ? residentCount + preLog.residentTotal : residentCount,
      // 刷卡记录上传数
      enRecordCount,
      // 刷卡记录上传总量
      enRecordTotal: preLog ? enRecordCount + preLog.enRecordTotal : enRecordCount,
      // 物业记录上传数
      propertyCoCount,
      // 物业上传总量
      propertyCoTotal: preLog ? propertyCoCount + preLog.propertyCoTotal : enRecordCount,
      // 设备上传数
      deviceCount,
      // 设备上传总量
      deviceTotal: preLog ? deviceCount + preLog.deviceTotal : deviceCount,
      // 实名认证数
      verifyCount,
      // 实名认证总量
      verifyTotal: preLog ? verifyCount + preLog.verifyTotal : verifyCount,
      // 黑名单数
      blackCount,
      // 黑名单总量
      blackTotal: preLog ? blackCount + preLog.blackTotal : blackCount,
      // 开门数
      openCount,
      // 开门总量
      openTotal: preLog ? openCount + preLog.openTotal : openCount,
      // 户主数
      ownerCount,
      // 户主总量
      ownerTotal: preLog ? ownerCount + preLog.ownerTotal : ownerCount,
    }
    return await this.logRecordModel.create(log);
  }
  // 根据固定条件获取用户数据
  async getUserRecord(type: string): Promise<{ list: IUserRecord[], today: IUserRecord }> {

    const userRecordToday: IUserRecord = await this.getUserRecordToday()
    if (type === 'day') {
      return { list: [userRecordToday], today: userRecordToday }
    }
    const condition: any = this.getCondition(type)
    const data: IUserRecord[] = await this.logRecordModel
      .find(condition)
      .select({
        residentCount: 0,
        residentTotal: 0,
        enRecordCount: 0,
        enRecordTotal: 0,
        deviceCount: 0,
        deviceTotal: 0,
        socCount: 0,
        socTotal: 0,
        propertyCoCount: 0,
        propertyCoTotal: 0,
      })
      .sort({ date: 1 })
      .lean()
      .exec()
    data.push(userRecordToday)
    return { list: data, today: userRecordToday }
  }

  // 根据zoneId查询
  async getUserRecordBetween(start: string, end: string): Promise<{ list: IUserRecord[], today: IUserRecord }> {
    const now = moment().format('YYYY-MM-DD')
    let condition: any;
    const userRecordToday = await this.getUserRecordToday();
    if (end === now) {
      const preDate = moment().add(-1, 'd').format('YYYY-MM-DD')
      condition = { $and: [{ date: { $lte: preDate } }, { date: { $gte: start } }] }
      if (start === end) {
        return { list: [userRecordToday], today: userRecordToday }
      }
    } else {
      condition = { $and: [{ date: { $lte: end } }, { date: { $gte: start } }] }
    }
    const data: IUserRecord[] = await this.logRecordModel
      .find(condition)
      .select({
        residentCount: 0,
        residentTotal: 0,
        enRecordCount: 0,
        enRecordTotal: 0,
        deviceCount: 0,
        deviceTotal: 0,
        socCount: 0,
        socTotal: 0,
        propertyCoCount: 0,
        propertyCoTotal: 0,
      })
      .sort({ date: 1 })
      .lean()
      .exec()
    if (end === now) {
      data.push(userRecordToday)
    }
    return { list: data, today: userRecordToday }
  }

  // 根据固定条件获取用户数据
  async getUploadRecord(type: string): Promise<{ list: IUploadRecord[], today: IUploadRecord }> {
    const uploadRecordToday: IUploadRecord = await this.getUploadRecordToday()
    if (type === 'day') {
      return { list: [uploadRecordToday], today: uploadRecordToday }
    }
    const condition: any = this.getCondition(type)
    const data: IUploadRecord[] = await this.logRecordModel
      .find(condition)
      .select({
        date: 1,
        residentCount: 1,
        residentTotal: 1,
        enRecordCount: 1,
        enRecordTotal: 1,
        deviceCount: 1,
        deviceTotal: 1,
        socCount: 1,
        socTotal: 1,
        propertyCoCount: 1,
        propertyCoTotal: 1,
      })
      .sort({ date: 1 })
      .lean()
      .exec()
    data.push(uploadRecordToday)
    return { list: data, today: uploadRecordToday }
  }

  // 根据zoneId查询
  async getUploadRecordBetween(start: string, end: string): Promise<{ list: IUploadRecord[], today: IUploadRecord }> {
    const now = moment().format('YYYY-MM-DD')
    let condition: any;
    let uploadRecordToday = await this.getUploadRecordToday();
    if (end === now) {
      const preDate = moment().add(-1, 'd').format('YYYY-MM-DD')
      condition = { $and: [{ date: { $lte: preDate } }, { date: { $gte: start } }] }
      if (start === end) {
        return { list: [uploadRecordToday], today: uploadRecordToday }
      }
    } else {
      condition = { $and: [{ date: { $lte: end } }, { date: { $gte: start } }] }
    }
    const data: IUploadRecord[] = await this.logRecordModel
      .find(condition)
      .select({
        date: 1,
        residentCount: 1,
        residentTotal: 1,
        enRecordCount: 1,
        enRecordTotal: 1,
        deviceCount: 1,
        deviceTotal: 1,
        socCount: 1,
        socTotal: 1,
        propertyCoCount: 1,
        propertyCoTotal: 1,
      })
      .sort({ date: 1 })
      .lean()
      .exec()
    if (end === now) {
      data.push(uploadRecordToday)
    }
    return { list: data, today: uploadRecordToday }
  }
}
import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import axios from 'axios';
import { CreateAdminDTO } from 'src/module/admin/dto/admin.dto';
import { AdminService } from 'src/module/admin/admin.service';
import { SOCUtil } from 'src/utils/soc.util';
import { ConfigService } from 'src/config/config.service';
import { UserService } from 'src/module/users/user.service';
import { LogRecordService } from 'src/module/logRecord/logRecord.service';

@Injectable()
export class InitService {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
    private readonly socUtil: SOCUtil,
    private readonly configService: ConfigService,
    private readonly logService: LogRecordService,
  ) { }

  async init() {
    await this.logService.initData()
    const adminExist = await this.adminService.countByCondition({ role: 0 })
    if (!adminExist) {
      const admin: CreateAdminDTO = {
        nickname: '超级管理员',
        role: '0',
        password: md5('111111'),
        phone: '12121212'
      }
      await this.adminService.create(admin)

    }
  }

}
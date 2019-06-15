import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import { CreateAdminDTO } from 'src/module/admin/dto/admin.dto';
import { AdminService } from 'src/module/admin/admin.service';
import { SOCUtil } from 'src/utils/soc.util';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class InitService {
  constructor(
    private readonly adminService: AdminService,
    private readonly socUtil: SOCUtil,
    private readonly configService: ConfigService,
  ) { }

  async init() {
    // const data = await this.socUtil.qrcodeAddress('')
    console.log(this.configService.weixinVerifyModel, 'data')
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
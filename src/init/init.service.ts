import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { CreateAdminDTO } from 'src/module/admin/dto/admin.dto';
import { AdminService } from 'src/module/admin/admin.service';
import { SOCUtil } from 'src/utils/soc.util';

@Injectable()
export class InitService {
  constructor(
    private readonly adminService: AdminService,
    private readonly socUtil: SOCUtil,
  ) { }

  async init() {
    // const data = await this.socUtil.qrcodeAddress('1A814683-14F8-6129-E054-90E2BA548A34')
    // console.log(data, 'data')
    // const adminExist = await this.adminService.countByCondition({ role: 0 })
    // if (!adminExist) {
    //   const admin: CreateAdminDTO = {
    //     nickname: '超级管理员',
    //     role: '0',
    //     password: md5('111111'),
    //     phone: '12121212'
    //   }
    // const data = await this.adminService.updateById('5ce4e773dee8256ff1af299a', { nickname: '超级管理员1' })
    // console.log(data, 'data')
    // }

  }

}
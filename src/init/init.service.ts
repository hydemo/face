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
    // const tokenResult = await axios({
    //   method: 'get',
    //   url: 'https://api.weixin.qq.com/cgi-bin/token',
    //   params: {
    //     grant_type: 'client_credential',
    //     appid: 'wxd4c91a5dcc220635',
    //     secret: '377d245e2e820d8b87c1be014def8816',
    //   },
    // });
    // const token = tokenResult.data.access_token
    // // console.log(tokenResult, 'token')
    // const url = 'http://shop.jstc-ws.com/admin/store.store_product/product_ist/type/1.html?page=1&limit=100&cate_id=+&store_name=&type=1'
    // const result = await axios({
    //   method: 'get',
    //   url,
    //   headers: {
    //     'Cookie': 'PHPSESSID=ur9adn4tu1hp7jfhkld6e41rut',
    //   },
    // });
    // const datas = result.data.data
    // const product: any = []
    // datas.map(data => {
    //   product.push({
    //     pid: data.id,
    //     image_info: {
    //       main_image_list: [
    //         { url: data.image }
    //       ]
    //     },
    //     category_info: {
    //       category_item: [{
    //         category_name: data.cate_id
    //       }]
    //     },
    //     official_category_info: {
    //       category_item: [{
    //         category_name: '食品生鲜'
    //       }]
    //     },
    //     link_info: {
    //       url: `/pages/goods_details/index?id=${data.id}`,
    //       wxa_appid: "wx34d0f6c020b64d38",
    //       link_type: "wxa"
    //     },
    //     title: data.store_name,
    //     sub_title: data.store_info,
    //     price_info: {
    //       min_price: data.price,
    //       max_price: data.price,
    //     },
    //     sale_info: {
    //       sale_status: data.is_show === 1 ? 'on' : 'off',
    //       stock: data.vstock
    //     },
    //   })
    // })
    // const up = await axios({
    //   method: 'post',
    //   url: `https://api.weixin.qq.com/scan/product/v2/add?access_token=${token}`,
    //   data: { product }
    // });
    // console.log(up, 'proc')
    // this.userService.cleanData()
    // const data = await this.socUtil.qrcodeAddress('')
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
import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import * as uuid from 'uuid/v4'
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { CryptoUtil } from './crypto.util';
import { IZoneProfile } from 'src/module/zone/interfaces/zonePrifile.interface';
import { IDetail } from 'src/module/zone/interfaces/detail.interface';
import { IUser } from 'src/module/users/interfaces/user.interfaces';

@Injectable()
export class SOCUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoUtil: CryptoUtil,
  ) { }
  /**
      * 获取随机数
      */
  getRandom(length: number): string {
    const random = Math.floor(Math.random() * Math.pow(10, length - 1) + 1)
    const randomLenght = random.toString().length
    const fixLength = length - randomLenght
    if (fixLength > 0) {
      return `${'0'.repeat(fixLength)}${random}`
    }
    return random.toString()
  }
  /**
 * 生成流水号
 */
  getOrder(): string {
    const title = 'xms'
    const time = moment().format('YYYYMMDDHHmmss')
    const random = this.getRandom(15)
    return `${title}${time}${random}`
  }
  /**
   * 封装请求
   *
   */
  async socRequest(data: any, serviceId: string): Promise<any> {
    const currdate: string = moment().format('YYYYMMDD');
    const jsonData = JSON.stringify(data)
    const key = new Buffer(this.config.socAESSecret, 'hex');
    const json = await this.cryptoUtil.encText(jsonData, key, null);
    const md: string = md5(this.config.socAppId + this.config.socAppSecret + currdate + json.replace(/\r\n/g, ''));
    const token = md.toUpperCase()
    const tranId = (Date.now() / 1000).toFixed(0);
    try {
      const result = await axios({
        method: 'post',
        url: this.config.socUrl,
        headers: {
          'Content-Type': 'application/json',
          token,
          tranId,
          serviceId,
          serviceValue: serviceId,
          versionCode: '',
          appid: this.config.socAppId,
        },
        data: json,
      })
      // console.log(result.data)
      // decodeURI(result.data.sta[0].des)
      // console.log(decodeURI(result.data.sta[0].des))
      return JSON.parse(decodeURIComponent(result.data))

    } catch (error) {
      return false
    }

    // console.log(result.data)
    // console.log(decodeURI(result.data))
  }

  /**
   * 根据二维码获取地址库信息
   * 
   * @param code 地址二维码
   */
  async qrcodeAddress(code: string): Promise<IZoneProfile[]> {

    const result = await this.qrcodeAddressByNo(code, '1')
    let list: IZoneProfile[] = result.list
    const page = result.page
    const totalPage = page.tsize
    let pno = 1
    while (Number(totalPage) > pno) {
      pno += 1
      const nextPage = await this.qrcodeAddressByNo(code, `${pno}`)
      list = [...list, ...nextPage.list]
    }
    return list
  }

  /**
  * 根据二维码获取地址库信息
  * 
  * @param code 地址二维码
  */
  async qrcodeAddressByNo(code: string, pno: string): Promise<any> {
    const data = {
      datas: [
        {
          DZBM: code,
        }
      ],
      pages: [
        {
          "psize": "200",
          "tcount": "1",
          "pno": pno,
          "tsize": "1",
        }
      ]
    }
    const result = await this.socRequest(data, 'dzfwpt_qrcode')
    if (!result) {
      return this.qrcodeAddressByNo(code, pno)
    }
    return { list: result.datas, page: result.pages[0] }
  }

  /**
   * 标准地址信息查询
   * 
   * @param code 地址二维码
   */
  async address(code: string): Promise<IDetail> {
    const data = {
      datas: [
        {
          EWM_SYSTEMID: code,
        }
      ],
      pages: [
        {
          "psize": "15",
          "tcount": "",
          "pno": '1',
          "tsize": "",
        }
      ]
    }
    const result = await this.socRequest(data, 'xjpt_xxba_addrewm_bs')
    if (!result) {
      return this.address(code)
    }
    // console.log(result, 'result')
    return result.datas[0]
  }
  genResidentData(dzbm: string, user: IUser, phone: string, reviewer: IUser, detail: IDetail) {
    const order = this.getOrder()
    const data =
    {
      lv_sbxxlsh: order,
      lv_gmsfhm: user.cardNumber,
      lv_xm: user.username,
      lv_zzdz_dzbm: dzbm,
      lv_lxdh: phone,
      lv_djdw_jgdm: detail.GAJGJGDM,
      lv_djdw_jgmc: detail.GAJGJGMC,
      lv_djr_gmsfhm: reviewer.cardNumber,
      lv_djr_xm: reviewer.username,
      lv_djsj: moment().format('YYYYMMDDHHmmss')
    }
    return data
  }
  /**
    * 上传数据
    * 
    * @param code 图片数据
    */
  async upload(datas: any[]): Promise<any> {
    const order = this.getOrder()
    const data = {
      datas
    }
    // const data = {
    //   datas: [
    //     {
    //       lv_sbxxlsh: order,
    //       lv_gmsfhm: '350583198912246076',
    //       lv_xm: '欧阳旭靖',
    //       lv_zzdz_dzbm: '4DE6E021-F52A-1A9C-E054-90E2BA510A0C',
    //       lv_lxdh: '13799746707',
    //       lv_djdw_jgdm: '350583730000',
    //       lv_djdw_jgmc: '南安市公安局柳城派出所',
    //       lv_djr_gmsfhm: '350583198912246076',
    //       lv_djr_xm: '杨晓峰',
    //       lv_djsj: moment().format('YYYYMMDDHHmmss')
    //     }
    //   ],
    //   pages: [
    //     {
    //       "psize": "15",
    //       "tcount": "",
    //       "pno": "1",
    //       "tsize": "",
    //     }
    //   ]
    // }
    try {
      const result = await this.socRequest(data, 'shhcj_xxba_jndj')
      if (result && result.sta.code === '0000') {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }

  }

  async check(order: string) {
    const data = {
      datas: [
        {
          sbxxlsh: order,
          cjbs: 'shhcj_xxba_jndj',
        }
      ],
      pages: [
        {
          "psize": "15",
          "tcount": "",
          "pno": "1",
          "tsize": "",
        }
      ]
    }
    const result = await this.socRequest(data, 'shhcj_feedback_cx')
  }
}
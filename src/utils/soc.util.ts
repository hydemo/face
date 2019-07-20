import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import * as uuid from 'uuid/v4'
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { CryptoUtil } from './crypto.util';
import { IZoneProfile } from 'src/module/zone/interfaces/zonePrifile.interface';
import { IDetail } from 'src/module/zone/interfaces/detail.interface';

@Injectable()
export class SOCUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoUtil: CryptoUtil,
  ) { }
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
    return JSON.parse(decodeURIComponent(result.data))
  }

  /**
   * 根据二维码获取地址库信息
   * 
   * @param code 地址二维码
   */
  async qrcodeAddress(code: string, pno: string): Promise<any> {
    const data = {
      datas: [
        {
          DZBM: code,
        }
      ],
      pages: [
        {
          "psize": "15",
          "tcount": "",
          "pno": pno,
          "tsize": "",
        }
      ]
    }
    const result = await this.socRequest(data, 'dzfwpt_qrcode')
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
    return result.datas[0]
  }

  /**
    * 上传数据
    * 
    * @param code 图片数据
    */
  async upload(): Promise<any> {

    const data = {
      datas: [
        {
          lv_sbxxlsh: uuid().replace(/-/g, ''),
          lv_gmsfhm: '350583198404040055',
          lv_xm: '杨晓峰',
          lv_zzdz_dzbm: '4DE6E021-F52A-1A9C-E054-90E2BA510A0C',
          lv_lxdh: '18065361777',
          lv_djdw_jgdm: this.config.companyAgencyCode,
          lv_djdw_jgmc: this.config.companyName,
          lv_djr_gmsfhm: '350583198912246076',
          lv_djr_xm: '欧阳旭靖',
          lv_djsj: moment().format('YYYYMMDDHHmmss')
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
    const result = await this.socRequest(data, 'shhcj_xxba_jndj')
    return { list: result.datas, page: result.pages[0] }
  }
}
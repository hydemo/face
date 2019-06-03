import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { CryptoUtil } from './crypto.util';

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
    console.log(JSON.stringify(jsonData))
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
    });
    return decodeURIComponent(result.data)
  }

  /**
   * 根据二维码获取地址库信息
   * 
   * @param code 图片数据
   */
  async qrcodeAddress(code: string): Promise<any> {
    const data = {
      datas: [
        {
          DZBM: '1D0075DB-8677-41E2-E054-90E2BA548A34',
        }
      ],
      pages: [
        {
          "psize": "20",
          "tcount": "",
          "pno": "2",
          "tsize": "",
        }
      ]
    }
    return await this.socRequest(data, 'dzfwpt_qrcode')
  }
}


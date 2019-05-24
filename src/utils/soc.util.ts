import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import * as md5 from 'md5';
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { CryptoUtil } from './crypto.util';
import { decode } from 'punycode';

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
    const s = "{\"datas\":[{\"EWM_SYSTEMID\":\"1A814683-14F8-6129-E054-90E2BA548A34\"}],\"pages\":[{\"psize\":\"10\",\"tcount\":\"1\",\"pno\":\"1\",\"tsize\":\"1\"}]}";
    const key = new Buffer(this.config.socAESSecret, 'hex');
    const json = await this.cryptoUtil.encText(s, key, null);
    const md: string = md5(this.config.socAppId + this.config.socAppSecret + currdate + json.replace(/\r\n/g, ''));
    const token = md.toUpperCase()
    console.log(token)
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
    return result.data
  }

  /**
   * 根据二维码获取地址库信息
   * 
   * @param code 图片数据
   */
  async qrcodeAddress(): Promise<any> {
    const code = 'BFC4B27E-F700-006C-E043-0A822906006C'

    const result = await this.socRequest("data", 'xjpt_xxba_addrewm_bs')
    const data = decodeURIComponent(result)
    console.log(data)
    const re = JSON.parse(data);
    console.log(re.sta)
    // console.log(decodeURI(result.sta[0].des), 'result')

  }
}


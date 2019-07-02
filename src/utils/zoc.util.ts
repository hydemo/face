import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { RedisService } from 'nestjs-redis';
import * as md5 from 'md5';
import * as uuid from 'uuid/v4'
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { CryptoUtil } from './crypto.util';
import { IResident } from 'src/module/resident/interfaces/resident.interfaces';
import { SOCUtil } from './soc.util';

@Injectable()
export class ZOCUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoUtil: CryptoUtil,
    private readonly redis: RedisService,
    private readonly socUtil: SOCUtil,
  ) { }


  /**
  * 生成流水号
  */
  getOrder(): string {
    const title = 'xms'
    const time = moment().format('YYYYMMDDHHmmss')
    const random = Math.floor(Math.random() * 10e14 + 1)
    return `${title}${time}${random}`
  }
  /**
   * 获取10位时间戳
   */
  getTemp(): string {
    var tmp = Date.now().toString();
    tmp = tmp.substr(0, 10);
    return tmp;
  }
  /**
   * 封装请求
   *
   */
  async zocRequest(data: any, serviceId: string): Promise<any> {
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
    });
    return JSON.parse(decodeURIComponent(result.data))
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<string> {
    const url = `${this.config.zocUrl}/api/login`;
    const ts = Date.now();
    const signString = `appid${this.config.zocAppId}appsecret${this.config.zocAppSecret}ts${ts}`
    const sign = this.cryptoUtil.encryptPassword(signString)
    const result = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        appid: this.config.zocAppId,
        appsecret: this.config.zocAppSecret,
        ts,
        sign,
      },
    });
    if (result.data.status === 100) {
      const token = result.data.data.token
      const client = this.redis.getClient()
      client.set('zoc_token', token, 'EX', 60 * 60 * 1.9)
      return token
    } else {
      return ''
    }
  }

  /**
   * 获取token
   */
  async getToken(): Promise<string> {
    const client = this.redis.getClient()
    const token = await client.get('zoc_token')
    if (!token) {
      return this.refreshToken()
    }
    return token;
  }

  /**
   * 上报小区住户信息
   */
  async uploadResident(): Promise<boolean> {
    const url = `${this.config.zocUrl}/api/check/gate/resident`;
    const token = await this.getToken()
    const order = this.getOrder()
    const address = await this.socUtil.address('4DE6E021-F538-1A9C-E054-90E2BA510A0C')
    const result = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        Ver: '1.7'
      },
      data: {
        SBXXLSH: order,
        SYSTEMID: address.SYSTEMID,
        DSBM: address.DSBM,
        DZMC: address.DZMC,
        QU_ID: address.QU_ID,
        QU: address.QU,
        DMDM: address.DMDM,
        DMMC: address.DMMC,
        XZJDDM: address.XZJDDM,
        XZJDMC: address.XZJDMC,
        SQJCWHDM: address.SQJCWHDM,
        SQJCWHMC: address.SQJCWHMC,
        DZYSLX: address.DZYSLX,
        MAPX: address.MAPX,
        MAPY: address.MAPY,
        GAJGJGDM: address.GAJGJGDM,
        GAJGNBDM: address.GAJGJGDM,
        GAJGJGMC: address.GAJGJGMC,
        JWWGDM: address.JWWGDM,
        JWWGMC: address.JWWGMC,
        ZHXM: '欧阳旭靖',
        ZHSJHM: '13799746707',
        ZHSFZ: '350583198912246076',
        ZHLX: '03',
        CJSJ: this.getTemp(),
        DJSJ: moment().format('YYYYMMDDHHmmss'),
        XTLY: '福建省南安市小门神智慧社区平台',
        SJCS: '91350206MA32HCJJ6X',
        GLMJSB: ['10028839'],
        ZHXB: '',
        ZHMZ: '',
        ZHJG: '',
        ZHSFZDZ: '',
        ICMJKKH: '',
        ICMJKZT: '',
        ICMJKLX: '',
        ZHZT: '',
        MJZH: '',
        MJMM: '',
      },
    });
    console.log(result, 'result')
    return true
  }
}


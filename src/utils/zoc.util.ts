import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { RedisService } from 'nestjs-redis';
import * as md5 from 'md5';
import * as fs from 'fs';
import * as path from 'path';
import * as Zip from 'jszip';
import { ConfigService } from 'src/config/config.service';
import axios from 'axios';
import { CryptoUtil } from './crypto.util';
import { SOCUtil } from './soc.util';
import { CameraUtil } from './camera.util';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';

@Injectable()
export class ZOCUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly cryptoUtil: CryptoUtil,
    private readonly redis: RedisService,
    private readonly cameraUtil: CameraUtil,
  ) { }

  /**
  * 删除文件夹
  */
  async rmdir(dir: string) {
    let arr = [dir]
    let current: any = null
    let index = 0
    while (current = arr[index++]) {
      // 读取当前文件，并做一个判断，文件目录分别处理
      let stat = fs.statSync(current)
      //如果文件是目录
      if (stat.isDirectory()) {
        //读取当前目录，拿到所有文件
        let files = fs.readdirSync(current)
        // 将文件添加到文件池
        arr = [...arr, ...files.map(file => path.join(current, file))]
      }
    }
    //遍历删除文件
    for (let i = arr.length - 1; i >= 0; i--) {
      // 读取当前文件，并做一个判断，文件目录分别处理
      let stat = fs.statSync(arr[i])
      // 目录和文件的删除方法不同
      if (stat.isDirectory()) {
        fs.rmdirSync(arr[i])
      } else {
        fs.unlinkSync(arr[i])
      }
    }
  }
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
   * 获取10位时间戳
   */
  getTemp(): string {
    var tmp = Date.now().toString();
    tmp = tmp.substr(0, 10);
    return tmp;
  }
  /**
   * 获取签名
   */
  getSignString(data: any): string {
    const keys = Object.keys(data);
    const sortKeys = keys.sort()
    let signString = ''
    for (let sortKey of sortKeys) {
      signString = `${signString}${sortKey}${data[sortKey]}`
    }
    return signString
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
      client.set('zoc_token', token, 'EX', 60 * 60 * 1)
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
    * 获取签名
    */
  async getEncodedata(json: string) {
    const url = `${this.config.zocUrl}/api/check/encrypt/zipdecrypt`;
    const token = await this.getToken()
    const key = this.config.zocUpSecret
    const result = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      data: {
        metadata: json,
        key,
      },
    });
    return result.data.data
  }
  /**
   * 上传数据报
   */
  async uploadZip(zipname: string) {
    const url = `${this.config.zocUrl}/api/upload/mj`;
    const token = await this.getToken()
    const buf = fs.readFileSync(`./upload/${zipname}`)
    const ts = Date.now()
    const zipdata = buf.toString('base64')
    const key = md5(buf)
    const signString = `md5sum${key}zipdata${zipdata}zipname${zipname}ts${ts}`
    const sign = this.cryptoUtil.encryptPassword(signString)
    const result = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      data: {
        md5sum: key,
        zipname,
        zipdata,
        ts,
        sign,
      },
    });
    console.log(result, 'result')
  }
  /**
   * 生成zip对象
   */
  async genZip() {
    return new Zip()
  }
  /**
  * 数据上报
  */
  async upload(zip: any, time: string) {
    return zip.generateAsync({  // 压缩类型选择nodebuffer，在回调函数中会返回zip压缩包的Buffer的值，再利用fs保存至本地
      type: "nodebuffer",
      // 压缩算法
      compression: "DEFLATE",
      compressionOptions: {
        level: 9
      }
    })
      .then(async content => {
        const random = this.getRandom(6)
        const zipname = `03-${this.config.companyCreditCode}-1.7-${time}-${random}.zip`
        fs.writeFileSync(`./upload/${zipname}`, content)
        await this.uploadZip(zipname)
        return { success: true, zipname }
      });
  }

  /**
   * 生成住户信息
   */
  async genResident(zip: any, time: String, address: any): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/resident`;
    // const token = await this.getToken()
    const order = this.getOrder()
    const data = {
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
      XTLY: this.config.companyAppName,
      SJCS: this.config.companyCreditCode,
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
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'resident')

    const json = JSON.stringify([data])
    const filename = `Resident-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('Resident')
    folder.file(filename, desData)
    return true
  }

  /**
  * 生成标准地址信息
  */
  async genBasicAddr(zip: any, time: String, address: any): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/addr`;
    // const token = await this.getToken()
    const data = {
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
      MDJD: address.MDJD,
    }
    //参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'basicAddr')

    const json = JSON.stringify([data])
    const filename = `BasicAddr-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('BasicAddr')
    folder.file(filename, desData)
    return true
  }

  /**
  * 生成小区物业信息
  */
  async genPropertyCo(zip: any, time: String, address: IZone): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/property`;
    // const token = await this.getToken()
    const data = {
      WYGS: address.propertyCo.name,
      JGDM: address.propertyCo.creditCode,
      WYGSFZR: address.propertyCo.contact,
      WYGSDH: address.propertyCo.contactPhone,
      WYGSDZ: address.propertyCo.address,
      XQDZBM: address.detail.SYSTEMID,
      GAJGJGDM: address.detail.GAJGJGDM,
      DSBM: address.detail.DSBM,
      QU_ID: address.detail.QU_ID,
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'propertyCo')

    const json = JSON.stringify([data])
    const filename = `PropertyCo-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('PropertyCo')
    return folder.file(filename, desData)
  }

  /**
 * 生成门禁设备信息
 */
  async genDevice(zip: any, time: String, address: any): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/device`;
    // const token = await this.getToken()
    const data = {
      MJCS: this.config.companyName,
      SBXQDZBM: address.SYSTEMID,
      SBDZBM: '50C92F98-CCE5-37D6-E054-90E2BA548A34',
      SBDZMC: '福建省南安市柳南中路60号保安室',
      AZDWMS: '前门',
      AZDWLX: '小区',
      MAPX: '118.39867161160882',
      MAPY: '24.95556924198733',
      MJCSDM: '91440300072526351A',
      MJJLX: '03',
      MJJBH: '10028839',
      MJJZT: 'Y',
      CJSJ: this.getTemp(),
      TYSJ: '',
      GAJGJGDM: address.GAJGJGDM,
      TJRQ: '2019-07-01',
      FWFGSL: '0',
      FWFGDZBM: []
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'device')

    const json = JSON.stringify([data])
    const filename = `Device-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('Device')
    folder.file(filename, desData)
    return true
  }

  /**
* 生成刷卡记录
*/
  async genEnRecord(zip: any, time: String, address: any): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/record`;
    // const token = await this.getToken()
    const data = {
      DSBM: address.SYSTEMID,
      DZMC: address.DZMC,
      GAJGJGDM: address.GAJGJGDM,
      KMSJ: this.getTemp(),
      ICMJKKH: '',
      ICMJKLX: '',
      ZHXM: '',
      ZHSJHM: '',
      ZHSFZ: '',
      ZHXB: '',
      ZHMZ: '',
      ZHJG: '',
      ZHSFZDZ: '',
      HZXM: '欧阳旭靖',
      HZSJHM: '13799746707',
      HZSFZ: '350583198912246076',
      MJCSDM: '91440300072526351A',
      MJJLX: '04',
      MJJBH: '10028839',
      MJJXX: '人脸开门',
      KMZT: 'Y',
      CZLX: '04',
      HJFJH: '',
      JCLX: 1,
      CRLX: 1,
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'record')

    const json = JSON.stringify([data])
    const filename = `EnRecord-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('EnRecord')
    folder.file(filename, desData)
    return true
  }

  /**
* 生成门禁厂商基础信息
*/
  async genManufacturer(zip: any, time: String): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/company`;
    // const token = await this.getToken()
    const data = {
      CSMC: this.config.companyName,
      ZZJGDM: this.config.companyCreditCode,
      CSDZ: this.config.companyAddress,
      LXR: this.config.companyContact,
      LXDH: this.config.companyContactPhone,
      LXYJ: '',
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'company')
    const json = JSON.stringify([data])
    const filename = `Manufacturer-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('Manufacturer')
    folder.file(filename, desData)
    return true
  }
  /**
* 生成图像数据
*/
  async genImage(zip: any, time: String, address: any, img: string): Promise<boolean> {
    // const url = `${this.config.zocUrl}/api/check/gate/image`;
    const ZP = await this.cameraUtil.getImg(img)
    // const token = await this.getToken()
    const data = {
      CASE_ID: this.getOrder(),
      ZPLX: '人口',
      ZP: img,
      GAJGJGDM: address.GAJGJGDM,
      GAJGNBDM: '',
      GAJGJGMC: address.GAJGJGMC,
      DJR_XM: this.config.managementName,
      HZSJHM: this.config.managementPhone,
      DJR_GMSFHM: this.config.managementCardNumber,
      DJSJ: time,
    }
    // 参数校验
    // const result = await axios({
    //   method: 'post',
    //   url,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: token,
    //   },
    //   data,
    // });
    // console.log(result.data, 'image')
    const json = JSON.stringify([data])
    const filename = `Image-${time}.json`
    const desData = await this.cryptoUtil.desText(json, this.config.zocUpSecret)
    const folder = zip.folder('Image')
    folder.file(filename, desData)
    return true
  }
}


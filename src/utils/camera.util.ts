import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as md5 from 'md5';
import axios from 'axios';
import * as fs from 'fs';
import * as uuid from 'uuid/v4';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from 'src/config/config.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { IFace } from 'src/module/face/interfaces/face.interfaces';
import { PhoneUtil } from './phone.util';
import { P2PErrorService } from 'src/module/p2pError/p2pError.service';
import { P2PErrorDTO } from 'src/module/p2pError/dto/p2pError.dto';

@Injectable()
export class CameraUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly phoneUtil: PhoneUtil,
    private readonly redis: RedisService,
    private readonly p2pErrorService: P2PErrorService,
  ) { }

  /**
   * 获取10位时间戳
   */
  getTemp(): number {
    let tmp = Date.now().toString();
    tmp = tmp.substr(0, 10);
    return Number(tmp);
  }
  /**
   * 获取设备白名单
   *
   * @param admin 用户名
   * @param password 登录密码
   * @param uuid 设备uuid
   * @param timeStamp 时间戳
   */
  sign(username: string, password: string, uuid: string, timeStamp: number): string {
    return md5(`${uuid}:${username}:${password}:${timeStamp}`)
  }

  /**
   * 获取设备白名单
   *s
   * @param device 设备信息
   * @param Mode 模式 device: IDevice, Mode: numbers
   */
  async getList(ip): Promise<any> {
    const { username = 'admin', password = 'oyxj19891024', deviceUUID = 'umettw42g7iu' } = {}
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const result = await axios({
      method: 'post',
      url: `http://${ip}:8011`,
      data: {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode: 1,
        Action: 'GetList',
        UUID: deviceUUID,
      }
    });
    return result.data.GetList.List
  }

  /**
   * 获取单张图片
   * 
   * @param face 名单信息
   * @param Mode 模式
   */
  async getOnePic(face: IFace, Mode: number): Promise<boolean> {
    const { device } = face
    const { username, password, deviceUUID } = device
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const result = await axios({
      method: 'post',
      url: this.config.p2pUrl,
      data: {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode,
        Action: 'GetOnePic',
        UUID: deviceUUID,
        GetOnePic: {
          LibIndex: face.libIndex,
          FlieIndex: face.flieIndex,
          Pic: face.pic,
        }
      }
    });
    console.log(result.data, 'result')
    if (result.data.Result === 'ok') {
      return true
    }
    return false
  }

  async getPersionInfo(PersonId: string, deviceUUID: string, PersonType: number) {
    // const { username, password, deviceUUID, session } = device
    // const deviceUUID = 'umet9bgg8bqu'
    const username = 'admin'
    const password = 'oyxj19891024'
    const timeStamp = this.getTemp()
    // const session = 'null_1564132555'
    const Sign = this.sign(username, password, deviceUUID, timeStamp)
    const data = {
      Name: 'personListRequest',
      // Session: session,
      UUID: deviceUUID,
      TimeStamp: timeStamp,
      Sign,
      Data:
      {
        Action: 'getPerson',
        PersonType,
        PersonId,
        GetPhoto: 0
      }
    }
    // console.log(data, 'data')
    const result = await axios({
      method: 'post',
      url: this.config.p2pUrl2,
      data
    });
    console.log(result.data, 'result')
    // console.log(result.data, 'data')
    if (result.data.Code === 1106) {
      return false
    } else if (result.data.Code === 1) {
      return true
    }
    return false
  }

  /**
   * 删除单张图片
   * 
   * @param face 名单信息
   */
  async deleteOnePic(faceData: any, device: IDevice) {
    const { username, password, deviceUUID, version, session } = device
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    let data: any;
    const LibIndex = faceData.LibIndex;
    const FlieIndex = faceData.FlieIndex;
    const Mode = faceData.mode;
    const Pic = faceData.Pic
    if (version === '1.0.0') {
      data = {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode,
        Action: 'DeleteOnePic',
        UUID: deviceUUID,
        DeleteOnePic: {
          LibIndex,
          FlieIndex,
          Pic,
        }
      }
    } else if (version === '1.1.0') {
      data = {
        Name: 'personListRequest',
        TimeStamp: timeStamp,
        Sign: sign,
        Action: 'DeleteOnePic',
        UUID: deviceUUID,
        Data: {
          Action: 'deletePerson',
          PersonType: Mode,
          PersonId: faceData.user,
        }
      }
    }
    return await this.handleRequest(data, version, faceData)
  }

  /**
   * 删除单张图片
   * 
   * @param face 名单信息
   */
  async updateOnePic(faceData: any, device: IDevice) {
    const { username, password, deviceUUID, version, session } = device
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const Img = await this.getImg(faceData.imgUrl)
    if (!Img) {
      return 'imgError'
    }
    const data = {
      Name: "personListRequest",
      TimeStamp: timeStamp,
      Sign: sign,
      UUID: deviceUUID,
      Data: {
        Action: 'editPerson',
        PersonType: faceData.mode,
        PersonInfo: {
          PersonId: faceData.user,
          PersonName: faceData.username,
          PersonPhoto: Img
        }
      }
    }
    return await this.handleRequest(data, version, faceData)
    // return await this.addOnePic(face[0].device, pic, face[0].mode, Img, face)
  }

  /**
   * 获取设备信息
   * 
   * @param face 名单信息
   */
  async getDeviceInfo(device: IDevice): Promise<any> {
    const { username, password, deviceUUID } = device
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const result = await axios({
      method: 'post',
      url: this.config.p2pUrl,
      data: {
        Name: 'DeviceInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        UUID: deviceUUID,
      }
    });
    return result.data
  }

  /**
  * 添加单张图片
  * 
  * @param username 设备信息
  * @param user 用户信息
  * @param face 名单信息
  */
  async addOnePic(faceData: any, device: IDevice) {
    const { username, password, deviceUUID, version, session } = device
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    let data: any
    const ImgName = faceData.username;
    const ImgNum = faceData.user;
    const Mode = faceData.mode;
    const Img = await this.getImg(faceData.imgUrl)
    if (!Img) {
      return 'imgError'
    }
    if (version === '1.0.0') {
      data = {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode,
        Action: 'AddOnePic',
        UUID: deviceUUID,
        AddOnePic: {
          Img,
          ImgName,
          ImgNum,
        }
      }
    } else if (version === '1.1.0') {
      data = {
        Name: "personListRequest",
        TimeStamp: timeStamp,
        Sign: sign,
        UUID: deviceUUID,
        Data: {
          Action: 'addPerson',
          PersonType: Mode,
          PersonInfo: {
            PersonId: ImgNum,
            PersonName: ImgName,
            PersonPhoto: Img
          }
        }
      }
    }
    return await this.handleRequest(data, version, faceData)
  }

  /**
  * 处理请求
  * 
  * @param data 请求参数
  
  */
  async handleRequest(data, version, faceData) {
    console.log(1)
    try {
      if (faceData.count > 18) {
        const error: P2PErrorDTO = {
          face: faceData.face,
          msg: 'networkError',
          type: faceData.type,
        }
        await this.p2pErrorService.create(error)
        return 'final'
      }
      const result: any = await axios({
        method: 'post',
        url: version === '1.0.0' ? this.config.p2pUrl : this.config.p2pUrl2,
        data,
      })
      console.log(result.data, 'result')
      let code;
      let msg;
      if (version === '1.0.0') {
        if (result.data.Result === 'ok') {
          return data.Action === 'AddOnePic' ? result.data.AddOnePic : 'success';
        }
        if (result.data.Code === -15 || result.data.Code === -13) {
          return 'imgError'
        }
        switch (result.data.ErrorCode) {
          case -3: code = 'success'
            break;
          case -6: code = 'success'
            break;
          case -15: code = 'imgError'
            break;
          case -13: code = 'imgError'
            break;
          case -19: code = 'error'
            break;
          case -20: code = 'error'
            break;
          default: { code = 'final', msg = JSON.stringify(result.data) }
            break;
        }
      } else if (version === '1.1.0') {
        if (result.data.Code === 1) {
          return 'success';
        }
        if (result.data.Code === 1106) {
          return 'noExist'
        }
        switch (result.data.Data.Result) {
          case -3: code = 'success'
            break;
          case -21: code = 'success'
            break;
          case -15: code = 'imgError'
            break;
          case -13: code = 'imgError'
            break;
          case -19: code = 'error'
            break;
          case -20: code = 'error'
            break;
          default: { code = 'final', msg = JSON.stringify(result.data) }
            break;
        }
      }
      if (code === 'final') {
        const error: P2PErrorDTO = {
          face: faceData.face,
          msg,
          type: faceData.type,
        }
        await this.p2pErrorService.create(error)
        await this.phoneUtil.sendP2PError()
        return 'final'
      }
      // if (code === 'error') {
      //   return 'error'
      // const errorData = { count: 1, upData }
      // const poolExist = await client.hget('p2pError_pool', upData.device)
      // if (!poolExist) {
      //   await client.hset('p2pError_pool', upData.device, 1)
      // }
      // await client.lpush(`p2pError_${upData.device}`, JSON.stringify(errorData))
      // }
      return code
    } catch (error) {
      // const client = this.redis.getClient()
      // const errorData = { ...faceData, count: 1 + faceData.count, }
      // const poolExist = await client.hget('p2pError_pool', upData.device)
      // if (!poolExist) {
      //   await client.hset('p2pError_pool', upData.device, 1)
      // }
      // await client.lpush(`p2pError_${pool}`, JSON.stringify(errorData))
      console.log(error, 'error')
      return 'error'
    }
  }
  // /**
  // * 处理p2p异常，重传5次
  // * 
  // * @param username 设备信息
  // * @param user 用户信息
  // * @param face 名单信息
  // */
  // async handleP2PEroor(errorData: any) {
  //   const client = this.redis.getClient()
  //   const { upData, count } = errorData
  //   try {
  //     const result: any = await axios({
  //       method: 'post',
  //       url: upData.version === '1.0.0' ? this.config.p2pUrl : this.config.p2pUrl2,
  //       data: upData.data,
  //     })
  //     console.log(result.data, 'result')
  //     let code;
  //     let msg
  //     if (upData.version === '1.0.0') {
  //       if (result.data.Result === 'ok') {
  //         return upData.data.Action === 'AddOnePic' ? result.data.AddOnePic : 'success';
  //       }
  //       if (result.data.Code === -15 || result.data.Code === -13) {
  //         return 'imgError'
  //       }
  //       switch (result.data.ErrorCode) {
  //         case -3: code = 'success'
  //           break;
  //         case -6: code = 'success'
  //           break;
  //         case -15: code = 'imgError'
  //           break;
  //         case -13: code = 'imgError'
  //           break;
  //         case -19: code = 'error'
  //           break;
  //         case -20: code = 'error'
  //           break;
  //         default: { code = 'final', msg = JSON.stringify(result.data) }
  //           break;
  //       }

  //     } else if (upData.version === '1.1.0') {
  //       if (result.data.Code === 1) {
  //         return 'success';
  //       }
  //       if (result.data.Code === 1106) {
  //         const data = upData.data
  //         const result = await axios({
  //           method: 'post',
  //           url: this.config.p2pUrl2,
  //           data: {
  //             Name: "personListRequest",
  //             TimeStamp: data.TimeStamp,
  //             Sign: data.Sign,
  //             UUID: data.UUID,
  //             Session: data.UUID,
  //             Data: {
  //               Action: 'addPerson',
  //               PersonType: data.Data.PersonType,
  //               PersonInfo: data.Data.PersonInfo
  //             }
  //           }
  //         });
  //         if (result.data.Result === 'ok') {
  //           return 'success'
  //         }
  //       }
  //       switch (result.data.Data.Result) {
  //         case -3: code = 'success'
  //           break;
  //         case -21: code = 'success'
  //           break;
  //         case -15: code = 'imgError'
  //           break;
  //         case -13: code = 'imgError'
  //           break;
  //         case -19: code = 'error'
  //           break;
  //         case -20: code = 'error'
  //           break;
  //         default: { code = 'final', msg = JSON.stringify(result.data) }
  //           break;
  //       }
  //     }

  //     if (code === 'final' || count > 8) {
  //       let face;
  //       if (upData.type === 'add' || upData.type === 'delete') {
  //         face = upData.face._id
  //       } else {
  //         face = upData.face[0]._id
  //       }
  //       const error: P2PErrorDTO = {
  //         face,
  //         msg,
  //       }
  //       await this.p2pErrorService.create(error)
  //       await this.phoneUtil.sendP2PError()
  //       return 'error'
  //     }
  //     if (code === 'error') {
  //       const newErrorData = { count: count + 1, upData }
  //       const poolExist = await client.hget('p2pError_pool', upData.device)
  //       if (!poolExist) {
  //         await client.hset('p2pError_pool', upData.device, 1)
  //       }
  //       await client.lpush(`p2pError_${upData.device}`, JSON.stringify(newErrorData))
  //     }
  //     return code;
  //   } catch (error) {
  //     if (count > 8) {
  //       let face;
  //       if (upData.type === 'add' || upData.type === 'delete') {
  //         face = upData.face._id
  //       } else {
  //         face = upData.face[0]._id
  //       }
  //       const error: P2PErrorDTO = {
  //         face,
  //         msg: 'neworkError',
  //       }
  //       await this.p2pErrorService.create(error)
  //       await this.phoneUtil.sendP2PError()
  //       return 'error'
  //     }
  //     const newErrorData = { count: count + 1, upData }
  //     const poolExist = await client.hget('p2pError_pool', upData.device)
  //     if (!poolExist) {
  //       await client.hset('p2pError_pool', upData.device, 1)
  //     }
  //     await client.lpush(`p2pError_${upData.device}`, JSON.stringify(newErrorData))
  //     return 'error'
  //   }
  // }

  /**
   * 根据图片地址生成base64
   * 
   * @param url 图片地址
   */
  async getImg(url: string): Promise<string | null> {
    try {
      const client = this.redis.getClient()
      const imgCount = await client.hget('img', url)
      const imgExist = await client.hget('imgBase64', url)
      if (imgExist) {
        return imgExist
      }
      const result: any = await axios.get(`${this.config.qiniuLink}/${url}?imageMogr2/auto-orient/thumbnail/650x/gravity/Center/crop/650x950/format/jpg/blur/1x0/quality/90|imageslim`, { responseType: 'arraybuffer' })
      const img = new Buffer(result.data, 'binary').toString('base64')
      if (imgCount && Number(imgCount) > 0) {
        await client.hset('imgBase64', url, img)
      }
      return img
    } catch (error) {
      return null
    }

  }

  async addToDevice(deviceUUID: string, user: any) {

    try {
      const username = 'admin'
      const password = 'oyxj19891024'
      // const id = String(_id)
      const timeStamp: number = this.getTemp()
      const img = await this.getImg(user.faceUrl)
      // if (!img) { return 'imgError' }
      const sign = await this.sign(username, password, deviceUUID, timeStamp)
      // console.log(version, 'version')
      // console.log(user.faceUrl, 'facedd')
      // const Img = await this.getImg(`${user.faceUrl}`);
      // if (version === '1.0.0') {
      // const ImgName = user.username;
      // const ImgNum = user._id;
      const data = {
        Name: "personListRequest",
        TimeStamp: timeStamp,
        Sign: sign,
        UUID: deviceUUID,
        Data: {
          Action: 'addPerson',
          PersonType: 2,
          PersonInfo: {
            PersonId: String(user._id),
            PersonName: user.username,
            PersonPhoto: img
          }
        }
      }
      const result: any = await axios({
        method: 'post',
        url: this.config.p2pUrl2,
        data,
      })
      let code;
      let msg;
      console.log(result.data)
      if (result.data.Code === 1) {
        return 'success';
      }
      if (result.data.Code === 1106) {
        return 'noExist'
      }
      switch (result.data.Data.Result) {
        case -3: code = 'success'
          break;
        case -21: code = 'success'
          break;
        case -15: code = 'imgError'
          break;
        case -13: code = 'imgError'
          break;
        case -19: code = 'error'
          break;
        case -20: code = 'error'
          break;
        default: { code = 'final', msg = JSON.stringify(result.data) }
          break;
      }
      if (code === 'final') {
        console.log(msg)
      }
      return code

    } catch (error) {
      console.log(error, 'error')
      return 'error'
    }
  }
}
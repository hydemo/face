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
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { IPic } from 'src/common/interface/pic.interface';
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
    if (result.data.Result === 'ok') {
      return true
    }
    return false
  }

  async getPersionInfo(PersonId: string, device: any, PersonType: number) {
    const { username, password, deviceUUID, session } = device
    // const deviceUUID = 'umet9bgg8bqu'
    // const username = 'admin'
    // const password = 'oyxj19891024'
    const timeStamp = this.getTemp()
    // const session = 'null_1564132555'
    const Sign = this.sign(username, password, deviceUUID, timeStamp)
    const data = {
      Name: 'personListRequest',
      Session: session,
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
  async deleteOnePic(face: IFace) {
    const { device } = face
    const { username, password, deviceUUID, _id, version, session } = device
    const id = String(_id)
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    let data: any;
    if (version === '1.0.0') {
      data = {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode: face.mode,
        Action: 'DeleteOnePic',
        UUID: deviceUUID,
        DeleteOnePic: {
          LibIndex: face.libIndex,
          FlieIndex: face.flieIndex,
          Pic: face.pic,
        }
      }
    } else if (version === '1.1.0') {
      data = {
        Name: 'personListRequest',
        TimeStamp: timeStamp,
        Sign: sign,
        Session: session,
        Action: 'DeleteOnePic',
        UUID: deviceUUID,
        Data: {
          Action: 'deletePerson',
          PersonType: face.mode,
          PersonId: face.user,
        }
      }
    }
    const upData = { data, face, type: 'delete', device: id, version }
    const client = this.redis.getClient()
    const poolExist = await client.hget('p2p_pool', id)
    if (!poolExist) {
      await client.hset('p2p_pool', id, 1)
    }
    await client.lpush(`p2p_${id}`, JSON.stringify(upData))
  }

  /**
   * 删除单张图片
   * 
   * @param face 名单信息
   */
  async updateOnePic(faces: IFace[], user: IUser, img: string, Mode: number) {
    if (!faces.length) {
      return
    }
    const client = this.redis.getClient()
    const face = faces[0]
    // await this.deleteOnePic(face[0])
    const { username, password, deviceUUID, _id, version, session } = face.device
    const id = String(_id)
    const Img = await this.getImg(img)
    const ImgName = user.username;
    const ImgNum = user._id;
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    if (version === '1.0.0') {
      const deleteData = {
        Name: 'WBListInfoREQ',
        TimeStamp: timeStamp,
        Sign: sign,
        Mode,
        Action: 'DeleteOnePic',
        UUID: deviceUUID,
        DeleteOnePic: {
          LibIndex: face.libIndex,
          FlieIndex: face.flieIndex,
          Pic: face.pic,
        }
      }
      const p2pDelete = { data: deleteData, face: faces, type: 'update-delete', device: _id, version }
      const poolExist = await client.hget('p2p_pool', id)
      if (!poolExist) {
        await client.hset('p2p_pool', id, 1)
      }
      await client.lpush(`p2p_${id}`, JSON.stringify(p2pDelete))
      const addData = {
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
      const upData = { data: addData, face: faces, type: 'update-add', device: _id, username: user.username, version }
      await client.lpush(`p2p_${id}`, JSON.stringify(upData))
    } else if (version === '1.1.0') {
      const data = {
        Name: "personListRequest",
        TimeStamp: timeStamp,
        Sign: sign,
        UUID: deviceUUID,
        Session: session,
        Data: {
          Action: 'editPerson',
          PersonType: Mode,
          PersonInfo: {
            PersonId: user._id,
            PersonName: user.username,
            PersonPhoto: Img
          }
        }
      }
      const upData = { data, face: faces, type: 'update', device: id, username: user.username, version }
      const client = this.redis.getClient()
      const poolExist = await client.hget('p2p_pool', id)
      if (!poolExist) {
        await client.hset('p2p_pool', id, 1)
      }
      await client.lpush(`p2p_${id}`, JSON.stringify(upData))
    }
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
  async addOnePic(device: IDevice, user: IPic, Mode: number, Img: string, face: IFace) {
    const { username, password, deviceUUID, _id, version, session } = device
    const id = String(_id)
    const timeStamp: number = this.getTemp()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    let data: any
    // console.log(user.faceUrl, 'facedd')
    // const Img = await this.getImg(`${user.faceUrl}`);
    if (version === '1.0.0') {
      const ImgName = user.username;
      const ImgNum = user._id;
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
        Session: session,
        Data: {
          Action: 'addPerson',
          PersonType: Mode,
          PersonInfo: {
            PersonId: user._id,
            PersonName: user.username,
            PersonPhoto: Img
          }
        }
      }
    }

    const upData = { data, face, type: 'add', device: id, username: user.username, version }
    const client = this.redis.getClient()
    const poolExist = await client.hget('p2p_pool', id)
    if (!poolExist) {
      await client.hset('p2p_pool', id, 1)
    }
    await client.lpush(`p2p_${id}`, JSON.stringify(upData))
  }

  /**
  * 添加单张图片
  * 
  * @param username 设备信息
  * @param user 用户信息
  * @param face 名单信息
  */
  async handleP2P(upData) {
    const client = this.redis.getClient()
    try {
      const result: any = await axios({
        method: 'post',
        url: upData.version === '1.0.0' ? this.config.p2pUrl : this.config.p2pUrl2,
        data: upData.data,
      })
      if (upData.type === 'delete' && upData.version === '1.0.0') {
      }
      let code;
      let msg;
      if (upData.version === '1.0.0') {
        if (result.data.Result === 'ok') {
          return upData.data.Action === 'AddOnePic' ? result.data.AddOnePic : 'success';
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

      } else if (upData.version === '1.1.0') {
        if (result.data.Code === 1) {
          return 'success';
        }
        if (result.data.Code === 1106) {
          const data = upData.data
          const result = await axios({
            method: 'post',
            url: this.config.p2pUrl2,
            data: {
              Name: "personListRequest",
              TimeStamp: data.TimeStamp,
              Sign: data.Sign,
              UUID: data.UUID,
              Session: data.UUID,
              Data: {
                Action: 'addPerson',
                PersonType: data.Data.PersonType,
                PersonInfo: data.Data.PersonInfo
              }
            }
          });
          if (result.data.Result === 'ok') {
            return 'success'
          }
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
        let face;
        if (upData.type === 'add' || upData.type === 'delet') {
          face = upData.face._id
        } else {
          face = upData.face[0]._id
        }
        const error: P2PErrorDTO = {
          face,
          msg,
        }
        await this.p2pErrorService.create(error)
        await this.phoneUtil.sendP2PError()
        return 'error'
      }
      if (code === 'error') {
        const errorData = { count: 1, upData }
        const poolExist = await client.hget('p2pError_pool', upData.device)
        if (!poolExist) {
          await client.hset('p2pError_pool', upData.device, 1)
        }
        await client.lpush(`p2pError_${upData.device}`, JSON.stringify(errorData))
      }
      return code
    } catch (error) {
      console.log(error)
      const errorData = { count: 1, upData }
      const poolExist = await client.hget('p2pError_pool', upData.device)
      if (!poolExist) {
        await client.hset('p2pError_pool', upData.device, 1)
      }
      await client.lpush(`p2pError_${upData.device}`, JSON.stringify(errorData))
      return 'error'
    }
  }
  /**
  * 处理p2p异常，重传5次
  * 
  * @param username 设备信息
  * @param user 用户信息
  * @param face 名单信息
  */
  async handleP2PEroor(errorData: any) {
    const client = this.redis.getClient()
    const { upData, count } = errorData
    try {
      const result: any = await axios({
        method: 'post',
        url: upData.version === '1.0.0' ? this.config.p2pUrl : this.config.p2pUrl2,
        data: upData.data,
      })
      console.log(result.data, 'result')
      let code;
      let msg
      if (upData.version === '1.0.0') {
        if (result.data.Result === 'ok') {
          return upData.data.Action === 'AddOnePic' ? result.data.AddOnePic : 'success';
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
          default: code = 'final'
            break;
        }

      } else if (upData.version === '1.1.0') {
        if (result.data.Code === 1) {
          return 'success';
        }
        if (result.data.Code === 1106) {
          const data = upData.data
          const result = await axios({
            method: 'post',
            url: this.config.p2pUrl2,
            data: {
              Name: "personListRequest",
              TimeStamp: data.TimeStamp,
              Sign: data.Sign,
              UUID: data.UUID,
              Session: data.UUID,
              Data: {
                Action: 'addPerson',
                PersonType: data.Data.PersonType,
                PersonInfo: data.Data.PersonInfo
              }
            }
          });
          if (result.data.Result === 'ok') {
            return 'success'
          }
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
          default: code = 'final'
            break;
        }
      }
      if (count > 5) {
        code = 'final'
      }

      if (code === 'final' || (code === 'error' && count > 8)) {
        let face;
        if (upData.type === 'add' || upData.type === 'delete') {
          face = upData.face._id
        } else {
          face = upData.face[0]._id
        }
        const error: P2PErrorDTO = {
          face,
          msg,
        }
        await this.p2pErrorService.create(error)
        await this.phoneUtil.sendP2PError()
        return 'error'
      }
      if (code === 'error') {
        const newErrorData = { count: count + 1, upData }
        const poolExist = await client.hget('p2pError_pool', upData.device)
        if (!poolExist) {
          await client.hset('p2pError_pool', upData.device, 1)
        }
        await client.lpush(`p2pError_${upData.device}`, JSON.stringify(newErrorData))
      }
      return code;
    } catch (error) {
      console.log(error, 'error')
      const newErrorData = { count: count + 1, upData }
      const poolExist = await client.hget('p2pError_pool', upData.device)
      if (!poolExist) {
        await client.hset('p2pError_pool', upData.device, 1)
      }
      await client.lpush(`p2pError_${upData.device}`, JSON.stringify(newErrorData))
      return 'error'
    }
  }

  /**
   * 根据图片地址生成base64
   * 
   * @param url 图片地址
   */
  async getImg(url: string): Promise<string> {
    const result: any = await axios.get(`${this.config.qiniuLink}/${url}?imageMogr2/auto-orient/thumbnail/650x/gravity/Center/crop/650x950/format/jpg/blur/1x0/quality/90|imageslim`, { responseType: 'arraybuffer' })
    const img = new Buffer(result.data, 'binary').toString('base64')
    return img
  }

  async addToDevice(deviceUUID: string, user: any, Img: string) {
    const username = 'admin'
    const password = 'oyxj19891024'
    // const id = String(_id)
    const timeStamp: number = this.getTemp()
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
      // Session: session,
      Data: {
        Action: 'addPerson',
        PersonType: 2,
        PersonInfo: {
          PersonId: user._id,
          PersonName: user.username,
          PersonPhoto: Img
        }
      }
    }
    try {
      const result: any = await axios({
        method: 'post',
        url: this.config.p2pUrl2,
        data,
      })
      if (result.data.Code === 1) {
        return 'success';
      }
      let code
      switch (result.data.Data.Result) {
        case -3: code = 'success'
          break;
        case -21: code = 'success'
          break;
        case -15: code = 'imgError'
          break;
        case -13: code = 'imgError'
          break;
        // case -19: code = 'error'
        //   break;
        // case -20: code = 'error'
        //   break;
        // default: code = 'final'
        //   break;
      }
      return code
    } catch (error) {
      return false
    }

    // if (result.data.Data.Result === -15 || result.data.ErrorCode === -13 || result.data.Code === -15 || result.data.Code === -13) {
    //   return 'imgError'
    // }
    // if (result.data.ErrorCode === -3) {
    //   // console.log(user, 'user')
    //   return 'exist'
    // }
  }
}
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as md5 from 'md5';
import axios from 'axios';
import * as uuid from 'uuid/v4';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from 'src/config/config.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';
import { IFace } from 'src/module/face/interfaces/face.interfaces';
import { IUser } from 'src/module/users/interfaces/user.interfaces';
import { config } from 'rxjs';
import { IPic } from 'src/common/interface/pic.interface';
import { PhoneUtil } from './phone.util';

@Injectable()
export class CameraUtil {
  constructor(
    private readonly config: ConfigService,
    private readonly phoneUtil: PhoneUtil,
    private readonly redis: RedisService,
  ) { }
  /**
   * 获取设备白名单
   *
   * @param admin 用户名
   * @param password 登录密码
   * @param uuid 设备uuid
   * @param timeStamp 时间戳
   */
  sign(username: string, password: string, uuid: string, timeStamp: string): string {
    return md5(`${uuid}:${username}:${password}:${timeStamp}`)
  }

  /**
   * 获取设备白名单
   *s
   * @param device 设备信息
   * @param Mode 模式 device: IDevice, Mode: numbers
   */
  async getList(ip): Promise<any> {
    console.log(222)
    const { username = 'admin', password = 'oyxj19891024', deviceUUID = 'umettw42g7iu' } = {}
    const timeStamp: string = Date.now().toString()
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
    const timeStamp: string = Date.now().toString()
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

  /**
   * 删除单张图片
   * 
   * @param face 名单信息
   */
  async deleteOnePic(face: IFace) {
    const { device } = face
    const { username, password, deviceUUID } = device
    const timeStamp: string = Date.now().toString()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const data = {
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
    const upData = { data, face, type: 'delete' }
    const client = this.redis.getClient()
    await client.lpush('p2p', JSON.stringify(upData))
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
    await this.deleteOnePic(face[0])
    console.log(faces, 'faces')
    const { username, password, deviceUUID } = face.device
    const Img = await this.getImg(img)
    const ImgName = user.username;
    const ImgNum = user._id;
    const timeStamp: string = Date.now().toString()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
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
    const p2pDelete = { data: deleteData, face: faces, type: 'update-delete' }
    await client.lpush('p2p', JSON.stringify(p2pDelete))
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
    const upData = { data: addData, face: faces, type: 'update-add' }
    await client.lpush('p2p', JSON.stringify(upData))
    // return await this.addOnePic(face[0].device, pic, face[0].mode, Img, face)
  }

  /**
   * 获取设备信息
   * 
   * @param face 名单信息
   */
  async getDeviceInfo(device: IDevice): Promise<any> {
    const { username, password, deviceUUID } = device
    const timeStamp: string = Date.now().toString()
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
  async addOnePic(device: IDevice, user: IPic, Mode: number, Img: string, face: any) {
    const { username, password, deviceUUID } = device
    // console.log(user.faceUrl, 'facedd')
    // const Img = await this.getImg(`${user.faceUrl}`);
    const ImgName = user.username;
    const ImgNum = user._id;
    const timeStamp: string = Date.now().toString()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    const data = {
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
    const upData = { data, face, type: 'add' }
    const client = this.redis.getClient()
    await client.lpush('p2p', JSON.stringify(upData))
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
        url: this.config.p2pUrl,
        data: upData.data,
      })
      if (result.data.Result === 'ok') {
        return result.data.AddOnePic;
      }
      if (result.data.ErrorCode === '-3' || result.data.ErrorCode === '-2') {
        return
      }
      const errorData = { count: 1, upData }
      await client.lpush('p2pError', JSON.stringify(errorData))
      return false
    } catch (error) {
      console.log(error)
      const errorData = { count: 1, upData }
      await client.lpush('p2pError', JSON.stringify(errorData))
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
    if (count > 5) {
      await client.lpush('p2pErrorFinal', JSON.stringify(errorData))
      await this.phoneUtil.sendP2PError()
      return null
    }
    try {
      const result: any = await axios({
        method: 'post',
        url: this.config.p2pUrl,
        data: upData.data,
      })
      if (result.data.Result === 'ok') {
        return result.data.AddOnePic;
      }
      if (result.data.ErrorCode === '-3' || result.data.ErrorCode === '-2') {
        return
      }
      const newErrorData = { count: count + 1, upData }
      await client.lpush('p2pError', JSON.stringify(newErrorData))
      return false
    } catch (error) {
      const newErrorData = { count: count + 1, upData }
      await client.lpush('p2pError', JSON.stringify(newErrorData))
    }
  }

  /**
   * 根据图片地址生成base64
   * 
   * @param url 图片地址
   */
  async getImg(url: string): Promise<string> {
    const result: any = await axios.get(`${this.config.qiniuLink}/${url}?imageMogr2/auto-orient/thumbnail/800x/gravity/Center/crop/780x780/blur/1x0/quality/100|imageslim`, { responseType: 'arraybuffer' })
    const img = new Buffer(result.data, 'binary').toString('base64')
    return img
  }
}
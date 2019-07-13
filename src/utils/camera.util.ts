import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as md5 from 'md5';
import axios from 'axios';
import * as uuid from 'uuid/v4';
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
    console.log(face, 'face')
    const { device } = face
    const { username, password, deviceUUID } = device
    const timeStamp: string = Date.now().toString()
    const sign = await this.sign(username, password, deviceUUID, timeStamp)
    try {
      const result = await axios({
        method: 'post',
        url: this.config.p2pUrl,
        data: {
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
      })
      console.log(result, 'result')
      if (result.data.Result === 'ok') {
        return true
      }
    } catch (error) {
      await this.phoneUtil.sendP2PError()
    }
    await this.phoneUtil.sendP2PError()
  }

  /**
   * 删除单张图片
   * 
   * @param face 名单信息
   */
  async updateOnePic(face: IFace, user: IUser, img: string) {
    await this.deleteOnePic(face)
    const pic: IPic = {
      username: user.username,
      _id: user._id,
      // faceUrl: img,
    }
    const Img = await this.getImg(img)
    return await this.addOnePic(face.device, pic, face.mode, Img)
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
  async addOnePic(device: IDevice, user: IPic, Mode: number, Img: string) {
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
    try {
      const result: any = await axios({
        method: 'post',
        url: this.config.p2pUrl,
        data,
      })
      console.log(result, 'addResult')
      if (result.data.Result === 'ok') {
        return result.data.AddOnePic;
      }
      return false
    } catch (error) {
      // return false
      await this.phoneUtil.sendP2PError()
    }
    // return await this.phoneUtil.sendP2PError()
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
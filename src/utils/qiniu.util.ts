import { Injectable } from '@nestjs/common';
import * as qiniu from 'qiniu';
import { ConfigService } from 'src/config/config.service';
import axios from 'axios'
import { Base64 } from 'js-base64';
import * as uuid from 'uuid/v4';

@Injectable()
export class QiniuUtil {
  constructor(private readonly config: ConfigService) { }
  /**
   * 获取七牛云token
   *
   */
  getToken(): string {
    const mac = new qiniu.auth.digest.Mac(this.config.qiniuAccessKey, this.config.qiniuSecretKey);
    const options = {
      scope: this.config.qiniuBucket,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    return uploadToken
  }

  /**
   * 上传base64文件到七牛云
   * 
   * @param img 图片数据
   */
  async uploadB64(img: string): Promise<string> {
    const token = await this.getToken()
    const key = Base64.encode(uuid() + '.' + 'jpg')
    const result: any = await axios({
      method: 'post',
      url: `${this.config.qiniuUploadUrl}/putb64/-1/key/${key}`,
      data: img,
      headers: {
        Authorization: `UpToken ${token}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    return result.data.key
  }
}


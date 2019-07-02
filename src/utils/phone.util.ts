import * as SMSClient from '@alicloud/sms-sdk';
import * as randomize from 'randomatic';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { RedisService } from 'nestjs-redis';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';

@Injectable()
export class PhoneUtil {

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) { }
  /**
   * 
   * @param {Object} phone 手机号
   * @returns {Promise} promise
   * @author:oy
   */
  sendVerificationCode(phone: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const accessKeyId = this.config.phoneAccessKey;
      const secretAccessKey = this.config.phoneAccessSecret;
      //生成验证码
      const code = randomize('0', 6);
      //生成手机连接    
      const smsClient = new SMSClient({ accessKeyId, secretAccessKey });
      //发送短信
      smsClient.sendSMS({
        PhoneNumbers: `${phone}`,
        SignName: this.config.signModel,
        TemplateCode: this.config.verifyModel,
        TemplateParam: `{ "code": "${code}" }`
      }).then((res) => {
        let { Code } = res;
        if (Code === 'OK') {
          const client = this.redis.getClient()
          client.set(phone, code, 'EX', 60 * 5);
          return resolve(true)
        }
      }, (err) => {
        throw new ApiException('验证码发送失败', ApiErrorCode.INTERNAL_ERROR, 500);
      })
    });
  }

  /**
   * 发送p2p异常提醒
   * @returns {Promise} promise
   * @author:oy
   */
  sendP2PError(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const accessKeyId = this.config.phoneAccessKey;
      const secretAccessKey = this.config.phoneAccessSecret;
      //生成验证码
      const code = randomize('0', 6);
      //生成手机连接    
      const smsClient = new SMSClient({ accessKeyId, secretAccessKey });
      //发送短信
      smsClient.sendSMS({
        PhoneNumbers: this.config.phoneNumber,
        SignName: this.config.signThinkThenModel,
        TemplateCode: this.config.p2pErrorModel,
      }).then((res) => {
        resolve(true)
      }, (err) => {
        reject(err)
      })
    });
  }

  /**
   * 发送p2p异常提醒
   * @returns {Promise} promise
   * @author:oy
   */
  sendDeviceError(location: string, id: string): Promise<boolean> {
    console.log(location, id)
    return new Promise((resolve, reject) => {
      const accessKeyId = this.config.phoneAccessKey;
      const secretAccessKey = this.config.phoneAccessSecret;
      //生成手机连接    
      const smsClient = new SMSClient({ accessKeyId, secretAccessKey });
      //发送短信
      smsClient.sendSMS({
        PhoneNumbers: this.config.phoneNumber,
        SignName: this.config.signThinkThenModel,
        TemplateCode: this.config.deviceErrorModel,
        TemplateParam: `{ "location": "${location}", "uuid": "${id}" }`
      }).then((res) => {
        resolve(true)
      }, (err) => {
        reject(err)
      })
    });
  }

  /*
   * ----{短信验证}----
   * @param {String} phone 手机号 
   * @param {String} code 验证码
   * @returns {Promise} promise
   * @author:oy 
   */
  async codeCheck(phone: string, code: string): Promise<boolean> {
    const client = this.redis.getClient()
    const storeCode: string | null = await client.get(phone);
    if (!storeCode) {
      throw new ApiException('验证码已过期', ApiErrorCode.CODE_EXPIRE, 406);
    }

    if (storeCode == code) {
      return true
    } else {
      throw new ApiException('验证码无效', ApiErrorCode.CODE_INVALID, 406);
    }
  }
}



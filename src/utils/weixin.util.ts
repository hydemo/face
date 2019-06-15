import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import * as jsSHA from 'jssha'
import { ConfigService } from 'src/config/config.service';
import { RedisService } from 'nestjs-redis';
import { ApiException } from 'src/common/expection/api.exception';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApplicationDTO } from 'src/common/dto/Message.dto';

@Injectable()
export class WeixinUtil {

    constructor(
        @Inject(ConfigService) private readonly config: ConfigService,
        private readonly redis: RedisService,
    ) { }
    /**
     * 获取微信access_token
     */
    async access_token(): Promise<string> {
        const client = this.redis.getClient()
        const access_token = await client.get('weixin_accessToken')
        if (access_token) {
            return access_token
        }
        const result = await axios({
            method: 'get',
            url: 'https://api.weixin.qq.com/cgi-bin/token',
            params: {
                grant_type: 'client_credential',
                appid: this.config.weixinAppid,
                secret: this.config.weixinAppSecret,
            },
        });
        await client.set('weixin_accessToken', result.data.access_token, 'EX', 60 * 60 * 1.5);
        return result.data.access_token
    }

    /**
     * 刷新ticket
     */
    async refreshTicket(): Promise<string> {
        const token = await this.access_token();
        const result = await axios({
            method: 'get',
            url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
            params: {
                access_token: token,
                type: 'jsapi'
            },
        });
        const ticket: string = result.data.ticket
        const client = this.redis.getClient()
        client.set('weixin_ticket', ticket, 'EX', 60 * 60 * 1.5);
        return ticket
    }
    /**
    * 获取ticket
    */
    async ticket(): Promise<string> {
        const client = this.redis.getClient()
        const ticket = await client.get('weixin_ticket')
        if (!ticket) {
            return this.refreshTicket()
        }
        return ticket
    }
    /**
     * 序列化参数
     */
    raw = function (args) {
        let keys = Object.keys(args);
        keys = keys.sort()
        const newArgs = {};
        keys.forEach(function (key) {
            newArgs[key.toLowerCase()] = args[key];
        });
        let string = '';
        for (let k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    };
    /**
    * 获取ticket
    */
    async sign(url: string): Promise<string> {
        const jsapi_ticket = await this.ticket()
        const nonceStr = Math.random().toString(36).substr(2, 15);
        const timestamp = parseInt(String(new Date().getTime() / 1000));
        const ret: any = {
            jsapi_ticket: jsapi_ticket,
            nonceStr,
            timestamp,
            url: url
        };
        const string = this.raw(ret);
        const shaObj = new jsSHA('SHA-1', 'TEXT');
        shaObj.update(string)
        ret.signature = shaObj.getHash('HEX');
        return ret;
    }
    // 扫一扫
    async scan(key: string): Promise<any> {
        const client = this.redis.getClient()
        const data = await client.get(key);
        if (!data) {
            throw new ApiException('二维码已过期', ApiErrorCode.CODE_EXPIRE, 406);
        }
        return JSON.parse(data)
    }
    // 授权登录
    async oauth(code: string): Promise<string | null> {
        const result = await axios({
            method: 'get',
            url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
            params: {
                appid: this.config.weixinAppid,
                secret: this.config.weixinAppSecret,
                code,
                grant_type: this.config.grantType,
            },
        });
        if (result && result.data && result.data.access_token) {
            return result.data.openid;
        }
        return null
    }

    async sendVerifyMessage(openId: string, data: ApplicationDTO) {
        const token = await this.access_token()
        console.log(this.config.weixinVerifyModel, 'tem')
        console.log(openId, 'openId')
        const result = await axios({
            method: 'post',
            url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`,
            data: {
                touser: openId,
                template_id: this.config.weixinVerifyModel,
                url: this.config.url,
                data,
            }
        });
        console.log(result, 'result')
        return
    }
}



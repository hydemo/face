import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as crypto from 'crypto';

@Injectable()
export class CryptoUtil {

    /**
     * 加密登录密码
     *
     * @param password 登录密码
     */
    encryptPassword(password: string): string {
        return createHash('sha256').update(password).digest('hex');
    }

    /**
     * 检查登录密码是否正确
     *
     * @param password 登录密码
     * @param encryptedPassword 加密后的密码
     */
    checkPassword(password: string, encryptedPassword: string): boolean {
        const currentPass = this.encryptPassword(password);
        if (currentPass === encryptedPassword) {
            return true;
        }
        return false;
    }

    checkKey(key) {
        const keySize = 128;
        if (!key) {
            throw 'AES.checkKey error: key is null ';
        }
        if (key.length !== (keySize / 8)) {
            throw 'AES.checkKey error: key length is not ' + (keySize / 8) + ': ' + key.length;
        }
    }

    /**
     * aes加密
     * @param key 密钥
     * @param message 包
     */
    encText(text, key, newIv) {
        const IV = new Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const CBC = 'cbc';
        const ECB = 'ecb';
        const NULL_IV = new Buffer([]);

        const cipherMode = ECB;
        const keySize = 128;
        const algorithm = 'aes-' + keySize + '-' + cipherMode;;
        var outputEncoding = 'hex';
        var inputEncoding = 'utf8';
        this.checkKey(key);
        var iv = newIv || IV;
        if (cipherMode === ECB) iv = NULL_IV;
        var inEncoding = inputEncoding;
        var outEncoding = outputEncoding;
        var buff = new Buffer(text, inEncoding);
        var out = this.encBytes(buff, key, iv);
        var re = new Buffer(out).toString(outEncoding);
        return re.toUpperCase();
    }

    encBytes(buffer, key, newIv) {
        const IV = new Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const CBC = 'cbc';
        const ECB = 'ecb';
        const NULL_IV = new Buffer([]);

        const cipherMode = ECB;
        const keySize = 128;
        const algorithm = 'aes-' + keySize + '-' + cipherMode;;
        var outputEncoding = 'base64';
        var inputEncoding = 'utf8';
        var outputEncoding = 'base64';
        var inputEncoding = 'utf8';
        this.checkKey(key);
        var iv = newIv || IV;
        if (cipherMode === ECB) iv = NULL_IV;
        var cipher = crypto.createCipheriv(algorithm, key, iv);
        cipher.setAutoPadding(true);
        var re = Buffer.concat([cipher.update(buffer), cipher.final()]);
        // console.log('enc re:%s,len:%d', printBuf(re), re.length);
        return re;
    }
    // return crypted;
    // const iv = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
    //     0x0e, 0x0f];
    // const cipher = crypto.createCipheriv(
    //     'aes-128-cbc',
    //     new Buffer(key, 'hex'),
    //     new Buffer(iv)
    // );
    // // cipher.setAutoPadding(true);
    // let encrypted = cipher.update(message, 'utf8', 'base64');
    // encrypted += cipher.final('base64');
    // console.log('encode message: ' + encrypted);
    // return crypted;
    // }

    strToBytes(str: string): any {
        let pos = 0;
        let len = str.length;
        if (len < 1) {
            return null;
        }
        len /= 2;
        const hexA = new Array();
        for (let i = 0; i < len; i++) {
            const s = str.substr(pos, 2);
            let value = parseInt(s, 16);
            const numberByte = value.toString(2)
            if (numberByte.length > 7) {
                const finalByte: string = numberByte.substring(numberByte.length - 8)
                const first = finalByte[0]
                const last = finalByte.slice(1).replace(/1/g, '2').replace(/0/g, '1').replace(/2/g, '0')
                value = parseInt(last, 2) + 1
                if (first === '1') {
                    value = -value
                }
            }
            hexA.push(value);
            pos += 2;
        }
        return hexA;

        // const buffer = new Buffer(8)
        // const result: any = []
        // for (let i = 0; i < str.length / 2; i++) {
        //     const high = parseInt(str.substring(i * 2, i * 2 + 1), 16);
        //     const low = parseInt(str.substring(i * 2 + 1, i * 2 + 2), 16);
        //     const number = high * 16 + low
        //     result[i] = buffer.writeDoubleLE(number);
        //     console.log(result[i])
        // }
        // return result;
    }


}
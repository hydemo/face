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
        const ECB = 'ecb';
        const NULL_IV = new Buffer([]);
        const cipherMode = ECB;
        var outputEncoding = 'hex';
        const inputEncoding = 'utf8';
        this.checkKey(key);
        let iv = newIv || IV;
        if (cipherMode === ECB) iv = NULL_IV;
        const inEncoding = inputEncoding;
        const outEncoding = outputEncoding;
        const buff = new Buffer(text, inEncoding);
        const out = this.encBytes(buff, key, iv);
        const re = new Buffer(out).toString(outEncoding);
        return re.toUpperCase();
    }

    encBytes(buffer, key, newIv) {
        const IV = new Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        const ECB = 'ecb';
        const NULL_IV = new Buffer([]);

        const cipherMode = ECB;
        const keySize = 128;
        const algorithm = 'aes-' + keySize + '-' + cipherMode;;
        this.checkKey(key);
        let iv = newIv || IV;
        if (cipherMode === ECB) iv = NULL_IV;
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        cipher.setAutoPadding(true);
        const re = Buffer.concat([cipher.update(buffer), cipher.final()]);
        return re;
    }
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
    }


    /**
     * des加密
     * @param key 密钥
     * @param message 包
     */
    dexText(text: string, secret: string) {
        const key = new Buffer(secret);
        const iv = new Buffer(0);
        const plaintext = text;
        const alg = 'des-ecb'
        const autoPad = true
        //encrypt  
        const cipher = crypto.createCipheriv(alg, key, iv);
        cipher.setAutoPadding(autoPad)  //default true  
        let ciph = cipher.update(plaintext, 'utf8', 'hex');
        ciph += cipher.final('hex');
        return ciph
    }
}
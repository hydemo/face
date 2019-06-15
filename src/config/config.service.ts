import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';

export interface EnvConfig {
  [prop: string]: string;
}

export interface Redis {
  host: string;
  port: number;
  db: number;
  password: string;
  // namespace: 'bbb',
  keyPrefix: string;
}

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(['development', 'production', 'test', 'provision'])
        .default('development'),

      PORT: Joi.number().default(8000),

      URL: Joi.string().required(),

      DATABASE_TYPE: Joi.string().default('mongodb'),

      DATABASE_HOST: Joi.string().default('localhost'),

      DATABASE_PORT: Joi.number().default(27017),

      DATABASE_USER: Joi.string().default('root'),

      DATABASE_PWD: Joi.string(),

      DATABASE_DB: Joi.string().required(),

      QINIU_ACCESSKEY: Joi.string().required(),

      QINIU_SECRETKEY: Joi.string().required(),

      QINIU_BUCKEY: Joi.string().required(),

      P2P_URL: Joi.string().required(),

      QINIU_UPLOAD_URL: Joi.string().required(),

      QINIU_LINK: Joi.string().required(),

      REDIS_HOST: Joi.string().required(),

      REDIS_PORT: Joi.number().default(6379),

      REDIS_DB: Joi.number().default(10),

      REDIS_PASS: Joi.string().required(),

      REDIS_KEYPREFIX: Joi.string().required(),

      PHONE_ACCESS_KEY: Joi.string().required(),

      PHONE_ACCESS_SECRET: Joi.string().required(),

      SOC_URL: Joi.string().required(),

      SOC_APPID: Joi.string().required(),

      SOC_APPSECRET: Joi.string().required(),

      SOC_AESSECRET: Joi.string().required(),

      WEIXIN_APPID: Joi.string().required(),

      WEIXIN_APPSECRET: Joi.string().required(),

      BLACK_MODE: Joi.number().default(1),

      WHITE_MODE: Joi.number().default(2),

      VIP_MODE: Joi.number().default(3),

      WEIXIN_OAUTH_URL: Joi.string().required(),

      WEIXIN_GRANT_TYPE: Joi.string().required(),

      WEINXIN_VERIFY_MODEL: Joi.string().required(),

      WEIXIN_APPLICATION_MODEL: Joi.string().required(),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get env(): string {
    return this.envConfig.NODE_ENV;
  }

  get port(): number {
    return Number(this.envConfig.PORT);
  }

  get url(): string {
    return this.envConfig.URL;
  }

  get databaseType(): string {
    return this.envConfig.DATABASE_TYPE;
  }

  get databaseUser(): string {
    return this.envConfig.DATABASE_USER;
  }

  get databasePwd(): string {
    return this.envConfig.DATABASE_PWD;
  }

  get databaseHost(): string {
    return this.envConfig.DATABASE_HOST;
  }

  get databasePort(): number {
    return Number(this.envConfig.DATABASE_PORT);
  }

  get databaseName(): string {
    return this.envConfig.DATABASE_DB;
  }

  get p2pUrl(): string {
    return this.envConfig.P2P_URL
  }

  get qiniuAccessKey(): string {
    return this.envConfig.QINIU_ACCESSKEY
  }

  get qiniuSecretKey(): string {
    return this.envConfig.QINIU_SECRETKEY
  }

  get qiniuBucket(): string {
    return this.envConfig.QINIU_BUCKEY
  }

  get qiniuUploadUrl(): string {
    return this.envConfig.QINIU_UPLOAD_URL
  }

  get qiniuLink(): string {
    return this.envConfig.QINIU_LINK
  }

  get redis(): Redis {
    return {
      host: this.envConfig.REDIS_HOST,
      port: Number(this.envConfig.REDIS_PORT),
      db: Number(this.envConfig.REDIS_DB),
      password: this.envConfig.REDIS_PASS,
      keyPrefix: this.envConfig.REDIS_KEYPREFIX,
    }
  }

  get phoneAccessKey(): string {
    return this.envConfig.PHONE_ACCESS_KEY
  }

  get phoneAccessSecret(): string {
    return this.envConfig.PHONE_ACCESS_SECRET
  }

  get socUrl(): string {
    return this.envConfig.SOC_URL
  }

  get socAppId(): string {
    return this.envConfig.SOC_APPID
  }

  get socAppSecret(): string {
    return this.envConfig.SOC_APPSECRET
  }

  get socAESSecret(): string {
    return this.envConfig.SOC_AESSECRET
  }

  get weixinAppid(): string {
    return this.envConfig.WEIXIN_APPID
  }

  get weixinAppSecret(): string {
    return this.envConfig.WEIXIN_APPSECRET
  }

  get blackMode(): number {
    return Number(this.envConfig.BLACK_MODE);
  }


  get whiteMode(): number {
    return Number(this.envConfig.WHITE_MODE);
  }

  get vipMode(): number {
    return Number(this.envConfig.VIP_MODE);
  }

  get oauthUrl(): string {
    return this.envConfig.WEIXIN_OAUTH_URL;
  }

  get grantType(): string {
    return this.envConfig.WEIXiN_GRANT_TYPE;
  }

  get weixinVerifyModel(): string {
    return this.envConfig.WEINXIN_VERIFY_MODEL
  }

  get weixinApplicationModel(): string {
    return this.envConfig.WEIXIN_APPLICATION_MODEL
  }
}

import { Model } from 'mongoose';
import { Inject, Injectable, Res } from '@nestjs/common';
import * as OAuth from 'co-wechat-oauth';
import { IUser } from './interfaces/user.interfaces';
import { CreateUserDTO, RegisterUserDTO, LoginUserDTO, VerifyUserDTO, ForgetPasswordDTO, ResetPasswordDTO, BindPhoneDTO } from './dto/users.dto';
import { Pagination } from '@common/dto/pagination.dto';
import { IList } from '@common/interface/list.interface';
import { CryptoUtil } from '@utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import * as uuid from 'uuid/v4';
import { ApiErrorCode } from '@common/enum/api-error-code.enum';
import { ApiException } from '@common/expection/api.exception';
import { LoginInfoDTO } from './dto/logininfo.dto';
import { ConfigService } from 'src/config/config.service';
import { DeviceService } from '../device/device.service';
import { IDevice } from '../device/interfaces/device.interfaces';
import { CameraUtil } from 'src/utils/camera.util';
import { CreateFaceDTO } from '../face/dto/face.dto';
import { FaceService } from '../face/face.service';
import { PhoneUtil } from 'src/utils/phone.util';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class UserService {
  // 注入的UserModelToken要与users.providers.ts里面的key一致就可以
  constructor(
    @Inject('UserModelToken') private readonly userModel: Model<IUser>,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
    @Inject(CameraUtil) private readonly cameraUtil: CameraUtil,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(DeviceService) private readonly deviceService: DeviceService,
    @Inject(FaceService) private readonly faceService: FaceService,
    @Inject(PhoneUtil) private readonly phoneUtil: PhoneUtil,
    private readonly redis: RedisService,
  ) { }

  // 根据id查询
  async findById(_id: string): Promise<IUser | null> {
    const user = await this.userModel
      .findById(_id)
      .lean()
      .exec();
    return user
  }

  // 用户列表
  async findAll(pagination: Pagination): Promise<IList<IUser>> {
    const search: any = [];
    const condition: any = {};
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const username: RegExp = new RegExp(sea[key], 'i');
          const phone: RegExp = new RegExp(sea[key], 'i');
          search.push({ username });
          search.push({ phone });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.userModel
      .find(condition)
      .sort({ lastLoginTime: -1 })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .select({ password: 0 })
      .exec();
    const total = await this.userModel.countDocuments(condition);
    return { list, total };
  }

  // 用户列表
  async findByZone(pagination: Pagination, zone: string): Promise<IList<IUser>> {
    const search: any = [];
    const condition: any = {};
    condition.zone = zone;
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const username: RegExp = new RegExp(sea[key], 'i');
          search.push({ username });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.userModel
      .find(condition)
      .sort({ lastLoginTime: -1 })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .select({ password: 0 })
      .exec();
    const total = await this.userModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id修改
  async updateById(_id: any, user: any) {
    if (user.phone) {
      const existing = await this.userModel.findOne({ _id: { $ne: _id }, phone: user.phone });
      if (existing) {
        throw new ApiException('手机已存在', ApiErrorCode.PHONE_EXIST, 406);
      }
    }
    return await this.userModel.findByIdAndUpdate(_id, user, { new: true }).exec();
  }
  // 根据id删除
  async blockById(_id: string) {
    return await this.userModel.findByIdAndUpdate(_id, { isBlock: true }).exec();
  }

  // 根据id修改发布资讯权限
  async canPublishNews(_id: string, canPublishNews: boolean) {
    return await this.userModel.findByIdAndUpdate(_id, { canPublishNews }).exec();
  }

  // 根据id修改密码
  async resetPassword(user: IUser, reset: ResetPasswordDTO) {
    if (!this.cryptoUtil.checkPassword(reset.oldPassword, user.password)) {
      throw new ApiException('密码有误', ApiErrorCode.PASSWORD_INVALID, 406);
    }
    const password = this.cryptoUtil.encryptPassword(reset.newpassword);
    return await this.userModel.findByIdAndUpdate(user._id, { password }).exec();
  }

  // 绑定手机号
  async bindPhone(user: IUser, bind: BindPhoneDTO) {
    await this.phoneUtil.codeCheck(bind.phone, bind.code)
    return await this.userModel.findByIdAndUpdate(user._id, { phone: bind.phone, isPhoneVerify: true }).exec();
  }

  async upload(userId: string, filename: string) {
    const user = await this.userModel.findByIdAndUpdate(userId, { avatar: filename });
    if (!user) {
      throw new ApiException('账号错误', ApiErrorCode.ACCOUNT_INVALID, 406);
    }
    delete user.password;
    return;
  }

  // 忘记密码
  async forgetPassword(forgetPassword: ForgetPasswordDTO) {
    await this.phoneUtil.codeCheck(forgetPassword.phone, forgetPassword.code)
    const password = this.cryptoUtil.encryptPassword(forgetPassword.password);
    return await this.userModel.findOneAndUpdate({ phone: forgetPassword.phone }, { password }).exec();
  }

  async updateMe(_id: string, user: any) {
    if (user.phone) {
      const existing = await this.userModel.findOne({ _id: { $ne: _id }, phone: user.phone });
      if (existing) {
        throw new ApiException('邮箱已存在', ApiErrorCode.PHONE_EXIST, 406);
      }
    }
    return await this.userModel.findByIdAndUpdate(_id, user).exec();
  }

  // async loginByWeixin(code: string, ip: string, fullUserInfo: LoginInfoDTO): Promise<UserDTO> {
  //   // 解释用户数据
  //   const userInfo = await this.weixinUtil.login(code, fullUserInfo);
  //   if (!userInfo || !userInfo.unionId) {
  //     throw new ApiException('登录失败', ApiErrorCode.LOGIN_ERROR, 406);
  //   }

  //   // 根据openid查找用户是否已经注册
  //   let user: IUser = await this.userModel.findOne({ unionId: userInfo.unionId }).lean().exec();
  //   if (!user) {
  //     // 注册
  //     user = await this.userModel.create({
  //       username: '微信用户' + uuid(),
  //       password: '',
  //       registerTime: Date.now(),
  //       registerIp: ip,
  //       phone: '',
  //       weixinOpenid: userInfo.openId,
  //       avatar: userInfo.avatarUrl || '',
  //       gender: userInfo.gender || 0, // 性别 0：未知、1：男、2：女
  //       nickname: userInfo.nickName,
  //       unionId: userInfo.unionId,
  //     });
  //   }
  //   // 更新登录信息
  //   await this.userModel.findByIdAndUpdate(user._id, {
  //     lastLoginTime: Date.now(),
  //     lastLoginIp: ip,
  //   });

  //   const accessToken = await this.jwtService.sign({ id: user._id, type: 'user' });
  //   if (!user || !accessToken) {
  //     throw new ApiException('登录失败', ApiErrorCode.LOGIN_ERROR, 406);
  //   }
  //   user.accessToken = accessToken;
  //   delete user.password;
  //   return user;
  // }

  async block(id: string, admin: string) {
    return await this.userModel.findByIdAndUpdate(id, {
      isBlock: true,
      blockTime: new Date(),
      blockAdmin: admin,
    })
  }

  async unblock(id: string, admin: string) {
    return await this.userModel.findByIdAndUpdate(id, {
      isBlock: false,
      unBlockTime: new Date(),
      unBlockAdmin: admin,
    })
  }

  // async OAuth(code: string, ip: string) {
  //   // 解释用户数据
  //   const client = new OAuth(this.configService.pcAppid, this.configService.pcSecret);
  //   const token = await client.getAccessToken(code);
  //   // const accessToken = token.data.access_token;
  //   const openid = token.data.openid;
  //   const userInfo = await client.getUser(openid)
  //   if (!userInfo) {
  //     throw new ApiException('登录失败', ApiErrorCode.LOGIN_ERROR, 406);
  //   }
  //   console.log(userInfo, ' userinfo')
  //   // 根据openid查找用户是否已经注册
  //   let user: IUser = await this.userModel.findOne({ unionId: userInfo.unionid }).lean().exec();
  //   if (!user) {
  //     // 注册
  //     user = await this.userModel.create({
  //       username: '微信用户' + uuid(),
  //       password: '',
  //       registerTime: Date.now(),
  //       registerIp: ip,
  //       phone: '',
  //       // weixinOpenid: userInfo.openId,
  //       avatar: userInfo.headimgurl || '',
  //       gender: userInfo.sex || 0, // 性别 0：未知、1：男、2：女
  //       nickname: userInfo.nickname,
  //       unionId: userInfo.unionid || null,
  //     });
  //   }

  //   // 更新登录信息
  //   await this.userModel.findByIdAndUpdate(user._id, {
  //     lastLoginTime: Date.now(),
  //     lastLoginIp: ip,
  //   });

  //   const accessToken = await this.jwtService.sign({ id: user._id, type: 'user' });
  //   if (!user || !accessToken) {
  //     throw new ApiException('登录失败', ApiErrorCode.LOGIN_ERROR, 406);
  //   }
  //   user.accessToken = accessToken;
  //   delete user.password;
  //   return user;
  // }

  // 管理员新增账号
  async createByAdmin(createUserDto: CreateUserDTO, ip: string): Promise<IUser> {
    if (!createUserDto.password) {
      throw new ApiException('密码不能为空', ApiErrorCode.INPUT_ERROR, 406);
    }
    const createUser: CreateUserDTO = {
      ...createUserDto,
      registerTime: new Date(),
      registerIp: ip,
      password: this.cryptoUtil.encryptPassword(createUserDto.password)
    }
    const user = new this.userModel(createUser);
    await user.save();
    return user;
  }

  // 管理员新增账号
  async create(createUser: CreateUserDTO): Promise<IUser> {

    const user = await this.userModel.create(createUser);
    return user;
  }

  async register(userDto: RegisterUserDTO, ip: string): Promise<boolean> {
    const exist = await this.userModel.countDocuments({ phone: userDto.phone })
    if (exist > 0) {
      throw new ApiException('手机已注册', ApiErrorCode.PHONE_EXIST, 406);
    }
    await this.phoneUtil.codeCheck(userDto.phone, userDto.code)
    delete userDto.code;
    const createUser: CreateUserDTO = {
      ...userDto,
      registerTime: new Date(),
      registerIp: ip,
      isPhoneVerify: true,
      isVerify: false,
      password: this.cryptoUtil.encryptPassword(userDto.password),
    }
    const user: IUser = new this.userModel(createUser);
    await user.save();
    return true;
  }

  async getCode(phone: string): Promise<boolean> {
    return await this.phoneUtil.sendVerificationCode(phone)
  }

  async phoneCheck(phone: string): Promise<boolean> {
    const exist = await this.userModel.countDocuments({ phone })
    return exist > 0
  }

  async codeCheck(phone: string, code: string): Promise<boolean> {
    await this.phoneUtil.codeCheck(phone, code)
    return true
  }

  async login(userDto: LoginUserDTO, ip: string): Promise<IUser> {

    const user: IUser | null = await this.userModel
      .findOne({ phone: userDto.phone })
      .lean()
      .exec()
    if (!user) throw new ApiException('账号不存在', ApiErrorCode.ACCOUNT_INVALID, 406);
    if (user.isBlock) throw new ApiException('账号已被禁用', ApiErrorCode.ACCOUNT_DELETED, 406);
    if (!this.cryptoUtil.checkPassword(userDto.password, user.password)) {
      throw new ApiException('密码有误', ApiErrorCode.PASSWORD_INVALID, 406);
    }
    await this.userModel
      .findByIdAndUpdate(
        user._id, { lastLoginTime: new Date(), lastLoginIp: ip })
      .lean()
      .exec()
    user.accessToken = await this.jwtService.sign({ id: user._id, type: 'user' });
    delete user.password;
    return user;
  }

  // 实名认证
  async verify(verify: VerifyUserDTO, user: IUser): Promise<null> {
    if (!user.isPhoneVerify && (!verify.phone || !verify.code)) {
      throw new ApiException('手机号未绑定', ApiErrorCode.INPUT_ERROR, 406);
    } else if (!user.isPhoneVerify && verify.phone && verify.code) {
      await this.phoneUtil.codeCheck(verify.phone, verify.code)
    }
    await this.userModel.findByIdAndUpdate(user._id, { ...verify, isVerify: true }).lean().exec()
    return null
  }

  // 根据条件查询
  async findByCondition(condition: any): Promise<IUser[]> {
    return await this.userModel.find(condition).lean().exec();
  }

  // 生成个人二维码
  async genQrcode(user: IUser) {
    const key = uuid()
    const client = this.redis.getClient()
    const value = {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      faceUrl: user.faceUrl,
      cardNumber: user.cardNumber,
    }
    client.set(key, JSON.stringify(value), 'EX', 60 * 2);
    return key
  }
}
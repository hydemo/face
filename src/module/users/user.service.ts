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
import { WeixinUtil } from 'src/utils/weixin.util';

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
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
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
  async updateById(_id: any, user: any): Promise<IUser | null> {
    if (user.phone) {
      const existing = await this.userModel.findOne({ _id: { $ne: _id }, phone: user.phone });
      if (existing) {
        throw new ApiException('手机已存在', ApiErrorCode.PHONE_EXIST, 406);
      }
    }
    const newUser = await this.userModel.findByIdAndUpdate(_id, user, { new: true }).exec();
    return newUser
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
    const existing = await this.userModel.findOne({ _id: { $ne: user._id }, phone: bind.phone });
    if (existing) {
      throw new ApiException('手机已存在', ApiErrorCode.PHONE_EXIST, 406);
    }
    return await this.userModel.findByIdAndUpdate(user._id, { phone: bind.phone, isPhoneVerify: true }).exec();
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

  async OAuth(code: string, ip: string): Promise<any> {
    // 解释用户数据
    const openId = await this.weixinUtil.oauth(code)
    // const accessToken = token.data.access_token;
    if (openId) {
      // 根据openid查找用户是否已经注册
      let user: IUser | null = await this.userModel.findOne({ openId }).lean().exec();
      if (!user) {
        // 注册
        user = await this.userModel.create({
          registerTime: Date.now(),
          registerIp: ip,
          openId,
        });
      }
      // 更新登录信息
      await this.userModel.findByIdAndUpdate(user._id, {
        lastLoginTime: Date.now(),
        lastLoginIp: ip,
      }).lean().exec();

      const accessToken: string = await this.jwtService.sign({ id: user._id, type: 'user' });
      const data = { ...user, accessToken }
      delete data.password;
      delete data.openId;
      return data;
    }
    return null
  }

  // 管理员新增账号
  async createByAdmin(createUserDto: CreateUserDTO, ip: string): Promise<IUser> {
    if (!createUserDto.password) {
      throw new ApiException('密码不能为空', ApiErrorCode.INPUT_ERROR, 406);
    }
    const existing = await this.userModel.findOne({ phone: createUserDto.phone });
    if (existing) {
      throw new ApiException('手机已存在', ApiErrorCode.PHONE_EXIST, 406);
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
    let returnUser: any = null
    let faceUser = user
    let isPhoneVerify = user.isPhoneVerify;
    if (!user.isPhoneVerify && (!verify.phone || !verify.code)) {
      throw new ApiException('手机号未绑定', ApiErrorCode.INPUT_ERROR, 406);
    } else if (verify.phone && verify.code) {
      const phoneExisting = await this.userModel.findOne({ _id: { $ne: user._id }, phone: verify.phone });
      if (phoneExisting) {
        throw new ApiException('手机已存在', ApiErrorCode.PHONE_EXIST, 406);
      }
      await this.phoneUtil.codeCheck(verify.phone, verify.code)
      isPhoneVerify = true
      const cardNumberExisting = await this.userModel
        .findOne({ _id: { $ne: user._id }, cardNumber: verify.cardNumber })
        .lean()
        .exec();
      if (cardNumberExisting && cardNumberExisting.isPhoneVerify) {
        throw new ApiException('身份证已被注册', ApiErrorCode.PHONE_EXIST, 406);
      }
      if (cardNumberExisting) {
        const update = {
          ...verify,
          isVerify: true,
          isPhoneVerify,
          openId: user.openId
        }
        const newUser = await this.userModel
          .findByIdAndUpdate(cardNumberExisting._id, update, { new: true })
          .select({ password: 0, openId: 0 })
          .lean()
          .exec()
        await this.userModel.findByIdAndRemove(user._id)
        newUser.accessToken = await this.jwtService.sign({ id: cardNumberExisting._id, type: 'user' });
        returnUser = newUser;
        faceUser = newUser
      }
    }
    if (verify.faceUrl) {
      await this.faceService.updatePic(faceUser, verify.faceUrl)
    }
    if (!returnUser) {
      await this.userModel.findByIdAndUpdate(user._id, { ...verify, isVerify: true, isPhoneVerify }).lean().exec()
    }
    return returnUser
  }

  // 根据条件查询
  async findByCondition(condition: any): Promise<IUser[]> {
    return await this.userModel.find(condition).lean().exec();
  }

  // 根据条件查询
  async findOneByCondition(condition: any): Promise<IUser> {
    return await this.userModel.findOne(condition).lean().exec();
  }


  // 生成个人二维码
  async genQrcode(user: IUser) {
    const key = uuid()
    const client = this.redis.getClient()
    const number = user.cardNumber
    const replaceStr = number.substring(4, 13);
    const str = '*'.repeat(replaceStr.length)
    const cardNumber = number.replace(replaceStr, str)
    const value = {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      faceUrl: user.faceUrl,
      cardNumber: cardNumber,
      isPhoneVerify: user.isPhoneVerify,
      type: 'user',
    }
    client.set(key, JSON.stringify(value), 'EX', 60 * 5);
    return key
  }

  async cleanData() {
    const users = await this.userModel.find()

    const cardNumbers: string[] = []
    for (let user of users) {
      if (cardNumbers.includes(user.cardNumber)) {
        await this.userModel.findByIdAndRemove(user._id)
      } else {
        cardNumbers.push(user.cardNumber)
      }
    }
  }
}
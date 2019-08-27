import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IContact } from './interfaces/contact.interfaces';
import { CreateContactDTO } from './dto/contact.dto';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { ApiException } from 'src/common/expection/api.exception';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { VerifyUserDTO, CreateUserDTO } from '../users/dto/users.dto';
import { UserService } from '../users/user.service';
import { RedisService } from 'nestjs-redis';
import { ConfigService } from 'src/config/config.service';
import { WeixinUtil } from 'src/utils/weixin.util';

@Injectable()
export class ContactService {
  constructor(
    @Inject('ContactModelToken') private readonly contactModel: Model<IContact>,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
  ) { }

  // 手动新增联系人
  async createByInput(contact: VerifyUserDTO, user: string, ip: string): Promise<IContact> {
    let createUser = await this.userService.findOneByCondition({ cardNumber: contact.cardNumber })
    if (!createUser) {
      const createUserDto: CreateUserDTO = {
        ...contact,
        registerIp: ip,
        registerTime: new Date(),
        isVerify: true,
        isPhoneVerify: false,
      }
      createUser = await this.userService.create(createUserDto)
      const client = this.redis.getClient()
      client.hincrby(this.config.LOG, this.config.LOG_VERIFY, 1)
    } else if (createUser.isPhoneVerify) {
      throw new ApiException('身份证已被注册,请通过扫一扫添加', ApiErrorCode.PHONE_EXIST, 406);
    }
    const exist = await this.contactModel.findOne({ user, contact: createUser._id })
    if (exist) {
      throw new ApiException('联系人已存在', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.contactModel.create({ user, contact: createUser._id })
  }

  // 扫码新增联系人
  async createByScan(key: string, user: string): Promise<IContact> {
    const contact = await this.weixinUtil.scan(key)
    if (contact.type !== 'user') {
      throw new ApiException('二维码有误', ApiErrorCode.QRCODE_ERROR, 406);
    }
    const exist = await this.contactModel.findOne({ user, contact: contact._id })
    if (exist) {
      throw new ApiException('用户已存在', ApiErrorCode.QRCODE_ERROR, 406);
    }
    return await this.contactModel.create({
      contact: contact._id,
      user
    })
  }

  // 新增入库
  async create(createContactDTO: CreateContactDTO): Promise<IContact> {
    return await this.contactModel.create(createContactDTO)
  }

  // 创建数据
  async list(pagination: Pagination, user: string): Promise<IList<IContact>> {
    const condition = { user }
    const list = await this.contactModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .populate({ path: 'contact', model: 'user', select: 'username faceUrl cardNumber phone' })
      .lean()
      .exec();
    const total = await this.contactModel.countDocuments(condition);
    return { list, total };
  }
  // 删除
  async delete(id: string, user: string): Promise<boolean> {
    const contact: IContact | null = await this.contactModel.findById(id)
    if (!contact) {
      return true
    }
    if (String(contact.user) !== String(user)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    await this.contactModel.findByIdAndDelete(id)
    return true
  }

}
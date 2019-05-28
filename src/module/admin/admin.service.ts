import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IAdmin } from './interfaces/admin.interfaces';
import { CreateAdminDTO, UpdateAdminDTO } from './dto/admin.dto';
import { Pagination } from '@common/dto/pagination.dto';
import { IList } from '@common/interface/list.interface';
import { CryptoUtil } from '@utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { ApiErrorCode } from '@common/enum/api-error-code.enum';
import { ApiException } from '@common/expection/api.exception';

@Injectable()
export class AdminService {
  constructor(
    @Inject('AdminModelToken') private readonly adminModel: Model<IAdmin>,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) { }

  // 创建数据
  async create(createAdminDTO: CreateAdminDTO): Promise<IAdmin> {
    const existing = await this.adminModel.findOne({ phone: createAdminDTO.phone, isDelete: false });
    if (existing) {
      throw new ApiException('手机已注册', ApiErrorCode.PHONE_EXIST, 406);
    }
    // 新账号创建
    createAdminDTO.password = await this.cryptoUtil.encryptPassword(createAdminDTO.password);
    return await this.adminModel.create(createAdminDTO);
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IAdmin>> {
    const search: any = [];
    const condition: any = {};
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
          const nickname: RegExp = new RegExp(sea[key], 'i');
          const phone: RegExp = new RegExp(sea[key], 'i');
          search.push({ nickname });
          search.push({ phone });
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.adminModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .select({ password: 0 })
      .exec();
    const total = await this.adminModel.countDocuments(condition);
    return { list, total };
  }

  // 根据id查询
  async findById(_id: string): Promise<IAdmin | null> {
    const admin: IAdmin | null = await this.adminModel
      .findById(_id)
      .lean()
      .exec()
    return admin
  }
  async countByCondition(condition: any): Promise<number> {
    return await this.adminModel.countDocuments(condition);
  }

  // 根据id修改
  async updateById(_id: string, updateAdminDto: UpdateAdminDTO): Promise<boolean> {
    const admin = await this.adminModel
      .findByIdAndUpdate(_id, updateAdminDto, { new: true })
      .lean()
      .exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return admin
  }
  // 根据id删除
  async deleteById(_id: string): Promise<boolean> {
    const admin = await this.adminModel
      .findByIdAndUpdate(_id, { isDelete: true, deleteTime: Date.now() })
      .lean()
      .exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return true
  }
  // 恢复以删除用户
  async recover(_id: string): Promise<boolean> {
    const admin = await this.adminModel
      .findByIdAndUpdate(_id, { isDelete: false, $unset: { deleteTime: 1 } })
      .lean()
      .exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return true
  }
  // 根据id修改密码
  async resetPassword(_id: string, newPass: string): Promise<boolean> {
    const password = this.cryptoUtil.encryptPassword(newPass);
    const admin = await this.adminModel.findByIdAndUpdate(_id, { password }).exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return true
  }

  // 根据id修改绑定手机号
  async updatePhone(_id: string, phone: string): Promise<boolean> {
    const existing = await this.adminModel.findOne({ phone, isDelete: false });
    if (existing) {
      throw new ApiException('手机已注册', ApiErrorCode.PHONE_EXIST, 406);
    }
    const admin = await this.adminModel.findByIdAndUpdate(_id, { phone }).exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return true
  }


  // 根据id修改角色
  async updateRole(_id: string, role: string): Promise<boolean> {
    const admin = await this.adminModel.findByIdAndUpdate(_id, { role }).exec();
    if (!admin) {
      throw new ApiException('管理员账号不存在', ApiErrorCode.NO_EXIST, 404);
    }
    return true
  }

  // 根据id修改密码
  async resetPasswordMe(me: IAdmin, newPass: string, olePass: string): Promise<boolean> {
    if (!this.cryptoUtil.checkPassword(olePass, me.password)) {
      throw new ApiException('密码错误', ApiErrorCode.PASSWORD_INVALID, 403);
    }
    const password = this.cryptoUtil.encryptPassword(newPass);
    await this.adminModel.findByIdAndUpdate(me._id, { password }).exec();
    return true
  }

  async login(username: string, password: string, ip: String): Promise<IAdmin> {
    const admin: IAdmin | null = await this.adminModel
      .findOne(
        {
          phone: username
        })
      .lean()
      .exec()
    if (!admin) throw new ApiException('登陆账号有误', ApiErrorCode.ACCOUNT_INVALID, 406);
    if (admin.isDelete) throw new ApiException('账号已删除', ApiErrorCode.ACCOUNT_DELETED, 406);
    if (!this.cryptoUtil.checkPassword(password, admin.password))
      throw new ApiException('密码有误', ApiErrorCode.PASSWORD_INVALID, 406);
    admin.accessToken = await this.jwtService.sign({ id: admin._id, type: 'admin' });
    delete admin.password;
    await this.adminModel
      .findOneAndUpdate(
        {
          phone: username
        }, { lastLoginTime: new Date(), lastLoginIp: ip })
      .lean()
      .exec()
    return admin;
  }
}
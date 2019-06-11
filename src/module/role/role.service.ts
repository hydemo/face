import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IRole } from './interfaces/role.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateRoleByScanDTO, RoleDTO } from './dto/role.dto';
import { WeixinUtil } from 'src/utils/weixin.util';
import { IUser } from '../users/interfaces/user.interfaces';

@Injectable()
export class RoleService {
  constructor(
    @Inject('RoleModelToken') private readonly roleModel: Model<IRole>,
    @Inject(WeixinUtil) private readonly weixinUtil: WeixinUtil,
  ) { }

  // 创建数据
  async create(role: RoleDTO): Promise<IRole> {
    const creatRole = await this.roleModel.create(role);
    return creatRole;
  }

  // 创建数据
  async createByScan(role: CreateRoleByScanDTO): Promise<IRole> {
    const user: IUser = await this.weixinUtil.scan(role.key)
    const exist: number = await this.roleModel.countDocuments({ user: user._id, role: role.role, zone: role.zone })
    if (exist) {
      throw new ApiException('已有该角色', ApiErrorCode.APPLICATION_EXIST, 406);
    }
    const createRole: RoleDTO = {
      user: user._id,
      zone: role.zone,
      role: role.role,
      description: role.description
    }
    return await this.roleModel.create(createRole);
  }

  // 删除数据
  async delete(id: string, userId: string, skip: number): Promise<IRole | null> {
    const role: IRole | null = await this.roleModel.findById(id)
    if (!role) {
      return null
    }
    if (role.role === 1) {
      throw new ApiException('物业无法删除', ApiErrorCode.NO_PERMISSION, 403);
    }
    const exist = await this.roleModel.findOne({ zone: role.zone, user: userId, isDelete: false, role: 1 })
    if (!exist) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    return await this.roleModel.findByIdAndUpdate(id, { isDelete: true });
  }

  // 删除物业
  async deleteManagement(id: string): Promise<IRole | null> {
    const role: IRole | null = await this.roleModel.findById(id)
    if (role && role.role === 1) {
      return await this.roleModel.findByIdAndUpdate(id, { isDelete: true })
    }
    return null
  }

  // 查询全部数据
  async findByManagement(pagination: Pagination, user: string) {
    if (!pagination.zone) {
      return { list: [], total: 0 }
    }
    const zone = pagination.zone;
    const canActive = await this.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = { isDelete: false, zone, role: { $lt: 4 } }
    const list: IRole[] = await this.roleModel
      .find(condition)
      .sort({ role: 1 })
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .populate({ path: 'user', model: 'user', select: 'username faceUrl phone' })
      .lean()
      .exec()
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };

  }

  // 查询全部数据
  async getTail(skip: number, zone: string, user: string): Promise<IRole | null> {
    const canActive = await this.checkRoles({ isDelete: false, role: 1, user, zone })
    if (!canActive) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = { isDelete: false, zone, role: { $lt: 4 } }
    const roles: IRole[] = await this.roleModel
      .find(condition)
      .sort({ role: 1 })
      .limit(1)
      .skip(skip - 1)
      .populate({ path: 'user', model: 'user', select: 'username faceUrl phone' })
      .lean()
      .exec()
    if (roles.length) {
      return roles[0]
    } else {
      return null
    }

  }

  // 查询全部数据
  async findManagements(pagination: Pagination): Promise<IList<IRole>> {
    const condition = { role: 1 }
    const list = await this.roleModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'user', model: 'user' })
      .populate({ path: 'zone', model: 'zone' })
      .lean()
      .exec();
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  // 查询全部数据
  async myRoles(userId: string, condition?: any) {
    const cond = { ...condition, user: userId, isDelete: false }
    let owner = [];
    let guard = [];
    let management = [];
    let worker = [];
    let rent = [];
    let isAdmin = false;
    const roles: any = await this.roleModel.aggregate([
      { $match: cond },
      { $group: { _id: '$role', zones: { $push: '$zone' } } },
      { $lookup: { from: 'zone', localField: 'zones', foreignField: '_id', as: 'zones' } },
    ])
    if (!roles.length) {
      return { owner, guard, management, worker, rent, isAdmin }
    }
    roles.map(role => {
      switch (role._id) {
        case 0: isAdmin = true;
          break;
        case 1: management = role.zones || [];
          break;
        case 2: worker = role.zones || [];
          break;
        case 3: guard = role.zones || [];
          break;
        case 4: owner = role.zones || [];
          break;
        case 5: rent = role.zones || [];
          break;
        default:
          break;
      }
    });
    return { owner, guard, management, worker, rent, isAdmin }
  }

  async checkRoles(condition: any) {
    return await this.roleModel.countDocuments(condition);
  }

  async findByZone(pagination: Pagination, zone: string) {
    const condition = { role: 1, zone, isDelete: false }
    const list = await this.roleModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .populate({ path: 'user', model: 'user', select: '-password' })
      .lean()
      .exec();
    const total = await this.roleModel.countDocuments(condition);
    return { list, total };
  }

  async findByCondition(condition: any) {
    return await this.roleModel.find(condition).populate({ path: 'zone', model: 'zones' }).lean().exec()
  }

  async findOneAndDelete(condition: any) {
    return await this.roleModel.findOneAndUpdate(condition, { isDelete: true })
  }

}
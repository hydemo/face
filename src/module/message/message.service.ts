import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IMessage } from './interfaces/message.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { CreateOrbitMessageDTO, CreateSystemMessageDTO } from './dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject('MessageModelToken') private readonly messageModel: Model<IMessage>,
  ) { }

  // 创建数据
  async createOrbitMessage(message: CreateOrbitMessageDTO): Promise<IMessage> {
    const creatMessage = await this.messageModel.create(message);
    return creatMessage;
  }

  // 创建数据
  async createSystemMessage(message: CreateSystemMessageDTO): Promise<IMessage> {
    const creatMessage = await this.messageModel.create(message);
    return creatMessage;
  }

  // 创建数据
  async delete(id: string, userId: string): Promise<IMessage | null> {
    const message: IMessage | null = await this.messageModel.findById(id)
    if (!message) {
      return null
    }
    if (String(userId) !== String(message.receiver)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    return await this.messageModel.findByIdAndUpdate(id, { isDelete: true });
  }

  // 查询全部数据
  async findAll(pagination: Pagination, receiver: string): Promise<IList<IMessage>> {
    const condition = { isDelete: false, receiver };
    const results = await this.messageModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
    const list = await Promise.all(results.map(async result => {
      if (result.type === 'black') {
        return result.populate({ path: 'sender', model: 'black' })
      } else {
        return result.populate({ path: 'sender', model: 'user' })
      }
    }))
    const total = await this.messageModel.countDocuments(condition);
    return { list, total };
  }

  // 滚动补全
  async getTail(skip: number, receiver: string): Promise<IMessage | null> {
    const condition = { isDelete: false, receiver };
    const list = await this.messageModel
      .find(condition)
      .limit(1)
      .skip(skip - 1)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (list.length) {
      return list[0]
    } else {
      return null
    }

  }

  // 查询全部数据
  async findMessagesById(pagination: Pagination, id: string, userId: string): Promise<IList<IMessage>> {
    const message: IMessage | null = await this.messageModel.findById(id)
    if (!message) {
      throw new ApiException('访问资源不存在', ApiErrorCode.DEVICE_EXIST, 404);
    }
    if (String(userId) !== String(message.receiver)) {
      throw new ApiException('无权限操作', ApiErrorCode.NO_PERMISSION, 403);
    }
    const condition = {
      isDelete: false,
      receiver: message.receiver,
      sender: message.sender,
      type: message.type
    };
    const list = await this.messageModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const total = await this.messageModel.countDocuments(condition);
    await this.messageModel.update({ sender: message.sender, receiver: message.receiver, type: message.type }, { isRead: true })
    return { list, total };
  }

}
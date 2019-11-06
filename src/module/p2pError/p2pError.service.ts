import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IP2PError } from './interfaces/p2pError.interfaces';
import { P2PErrorDTO } from './dto/p2pError.dto';

@Injectable()
export class P2PErrorService {
  constructor(
    @Inject('P2PErrorModelToken') private readonly p2pErrorModel: Model<IP2PError>,
  ) { }

  // 创建数据
  async create(data: P2PErrorDTO): Promise<IP2PError> {
    return await this.p2pErrorModel.create(data);
  }

  // 创建数据
  async find(condition: any): Promise<IP2PError[]> {
    return await this.p2pErrorModel.find(condition).lean().exec();
  }

  // 创建数据
  async remove(id: string): Promise<IP2PError> {
    return await this.p2pErrorModel.findByIdAndDelete(id).lean().exec();
  }
}
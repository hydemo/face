import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IP2PError } from './interfaces/p2pError.interfaces';

@Injectable()
export class P2PErrorService {
  constructor(
    @Inject('P2PErrorModelToken') private readonly p2pErrorModel: Model<IP2PError>,
  ) { }

  // 创建数据
  async create(data: string): Promise<IP2PError> {
    return await this.p2pErrorModel.create({ data });
  }
}
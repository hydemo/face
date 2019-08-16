import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Inject, Injectable } from '@nestjs/common';
import { IMedia } from './interfaces/media.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { MediaDTO } from './dto/media.dto';
import { CryptoUtil } from 'src/utils/crypto.util';

@Injectable()
export class MediaService {
  constructor(
    @Inject('MediaModelToken') private readonly mediaModel: Model<IMedia>,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
  ) { }

  // 创建数据
  async create(createMediaDTO: MediaDTO): Promise<IMedia> {
    const creatMedia = new this.mediaModel(createMediaDTO);
    await creatMedia.save();
    return creatMedia;
  }

  // 根据id查找
  async findById(id: string): Promise<IMedia | null> {
    return await this.mediaModel.findById(id)
  }

  // 根据token查找
  async findByToken(token: string): Promise<IMedia | null> {
    return await this.mediaModel.findOne({ token })
  }

  // 查询全部数据
  async findAll(pagination: Pagination): Promise<IList<IMedia>> {
    const search: any = [];
    const condition: any = {};
    if (pagination.search) {
      const sea = JSON.parse(pagination.search);
      for (const key in sea) {
        if (key === 'base' && sea[key]) {
        } else if (sea[key] === 0 || sea[key]) {
          condition[key] = sea[key];
        }
      }
      if (search.length) {
        condition.$or = search;
      }
    }
    const list = await this.mediaModel
      .find(condition)
      .limit(pagination.limit)
      .skip((pagination.offset - 1) * pagination.limit)
      .lean()
      .exec();
    const total = await this.mediaModel.countDocuments(condition);
    return { list, total };
  }
  async login(username: string, password: string) {
    const media: IMedia | null = await this.mediaModel
      .findOne({ username })
      .lean()
      .exec()
    if (!media) {
      throw new ApiException('广告机不存在', ApiErrorCode.ACCOUNT_INVALID, 406);
    }
    if (!this.cryptoUtil.checkPassword(password, media.password)) {
      throw new ApiException('密码有误', ApiErrorCode.PASSWORD_INVALID, 406);
    }
    const token = await this.jwtService.sign({ id: media._id, type: 'media' })
    await this.mediaModel.findByIdAndUpdate(media._id, { token });
  }
}
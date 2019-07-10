import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { IPreowner } from './interfaces/preowner.interfaces';
import { ApiErrorCode } from 'src/common/enum/api-error-code.enum';
import { ApiException } from 'src/common/expection/api.exception';
import { Pagination } from 'src/common/dto/pagination.dto';
import { IList } from 'src/common/interface/list.interface';
import { XLSXUtil } from 'src/utils/xlsx.util';

@Injectable()
export class PreownerService {
  constructor(
    @Inject('PreownerModelToken') private readonly PreownerModel: Model<IPreowner>,
    @Inject(XLSXUtil) private readonly XLSX: XLSXUtil,
  ) { }

  // 导入
  async upload(zone: string, filename: string) {
    const worksheet = await this.XLSX.getWorksheet(`upload/excel/${filename}`);
    const owners = await this.XLSX.genOwner(worksheet, zone);
    return await Promise.all(owners.map(async owner => {
      await this.PreownerModel.create(owner)
    }))
  }

  // 根据身份证查找
  async findByCardNumber(cardNumber: string, zone: string) {
    return this.PreownerModel.find({ cardNumber, zone }).lean().exec()
  }

}
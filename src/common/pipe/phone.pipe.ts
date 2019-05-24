import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Validator } from 'class-validator';
import { ApiException } from '../expection/api.exception';
import { ApiErrorCode } from '../enum/api-error-code.enum';

const validator = new Validator();

@Injectable()
export class PhonePipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!validator.isMobilePhone(value, 'zh-CN')) {
      throw new ApiException('无效的手机', ApiErrorCode.INPUT_ERROR, 406);
    }
    return value;
  }
}
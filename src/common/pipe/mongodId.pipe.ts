import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Validator } from 'class-validator';
import { ApiException } from '../expection/api.exception';
import { ApiErrorCode } from '../enum/api-error-code.enum';

const validator = new Validator();

@Injectable()
export class MongodIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!validator.isMongoId(value)) {
      throw new ApiException('无效的ID', ApiErrorCode.USER_ID_INVALID, 406);
    }
    return value;
  }
}
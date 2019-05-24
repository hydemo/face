import { IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PicDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly libIndex: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly flieIndex: number;

  @IsString()
  @Type(() => String)
  readonly pic: string;
}

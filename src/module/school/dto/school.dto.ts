import { ApiModelProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDate, IsEnum, IsNumber, IsArray, IsPositive, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParentDTO {
  user: string;
  parentType: string;
}
export class StudentDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '班主任' })
  readonly owner: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况' })
  readonly checkResult: number;

  @IsString()
  @IsEnum(['owner', 'student', 'visitor'])
  @Type(() => String)
  @ApiModelProperty({ description: '住客类型' })
  readonly type: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly applicationTime: Date;

  @IsArray()
  @ApiModelProperty({ description: '家长' })
  readonly parent: ParentDTO[];
}

export class HeadTeacherDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况' })
  readonly checkResult: number;

  @IsString()
  @IsEnum(['owner', 'student', 'visitor'])
  @Type(() => String)
  @ApiModelProperty({ description: '住客类型' })
  readonly type: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly applicationTime: Date;

}

export class VisitorDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '区域' })
  readonly zone: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '用户' })
  readonly user: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '班主任' })
  readonly owner: string;

  @IsNumber()
  @IsEnum([1, 2, 3])
  @Type(() => Number)
  @ApiModelProperty({ description: '审核情况' })
  readonly checkResult: number;

  @IsString()
  @IsEnum(['owner', 'student', 'visitor'])
  @Type(() => String)
  @ApiModelProperty({ description: '住客类型' })
  readonly type: string;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '申请时间' })
  readonly applicationTime: Date;

  @IsDate()
  @Type(() => Date)
  @ApiModelProperty({ description: '过期时间' })
  readonly expireTime: Date;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '申请理由' })
  readonly visitorReason: string;
}

export class StudentApplicationDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '学生id' })
  readonly user: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '家长类型' })
  parentType: string;
}

export class CreateHeadTeacherDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '班主任id' })
  readonly key: string;
}


export class HeadTeacherApplicationDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;
}

export class VisitorApplicationDTO {
  @IsMongoId()
  @Type(() => String)
  @ApiModelProperty({ description: '地址ID' })
  readonly address: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '申请理由' })
  readonly visitorReason: string;
}

export class UpdateStudentDTO {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '用户名' })
  readonly username: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '人脸' })
  readonly faceUrl: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '头像' })
  readonly cardNumber: string;
}

export class BindParent {
  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '二维码' })
  readonly key: string;

  @IsString()
  @Type(() => String)
  @ApiModelProperty({ description: '家长类型' })
  readonly parentType: string;

}








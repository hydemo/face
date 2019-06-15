export class BaseMessageDTO {
  readonly value: string;
  readonly color: string;
}
export class ApplicationDTO {
  readonly first: BaseMessageDTO;
  readonly keyword1: BaseMessageDTO;
  readonly keyword2: BaseMessageDTO;
  readonly keyword3: BaseMessageDTO;
  readonly keyword4?: BaseMessageDTO;
  readonly remark: BaseMessageDTO;
}
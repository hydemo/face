import {
  WebSocketGateway,
  SubscribeMessage,
  WsResponse,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { IMedia } from './interfaces/media.interfaces';
import { MediaService } from './media.service';

interface IWs {
  // id
  readonly id: string;
  // 客户端
  readonly client: any;
}
interface IMessage {
  // 类型
  type: string;
  // 照片
  imgUrl?: string;
}

@WebSocketGateway()
export class MediaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;

  connectedMedias: IWs[] = [];

  constructor(
    private readonly jwtService: JwtService,
    private readonly mediaService: MediaService,
  ) { }

  async handleConnection(client) {
    const media: any = await this.jwtService.verify(
      client.handshake.headers.Authorization.replace('Bearer ', ''),
    )
    const mediaExist = await this.mediaService.findById(media.id)
    if (!mediaExist) {
      return
    }
    this.connectedMedias = [...this.connectedMedias, { id: String(media.id), client }];
    client.emit('connect', '连接成功')
  }

  async handleDisconnect(socket) {
    // console.log(111)
  }

  @SubscribeMessage('message')
  async sendMessage(id: string, message: IMessage) {
    const client: any = this.connectedMedias.map(media => media.id === id)
    if (!client) return
    client.emit('message', message)
  }
}
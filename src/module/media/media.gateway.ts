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
    console.log(client.handshake.query.token, 'token')
    const media: any = await this.jwtService.verify(
      client.handshake.query.token,
    )
    const mediaExist = await this.mediaService.findById(media.id)
    if (!mediaExist) {
      return
    }
    const index = this.connectedMedias.findIndex(v => v.id === String(media.id))
    if (index < 0) {
      this.connectedMedias = [...this.connectedMedias, { id: String(media.id), client }];
    } else {
      this.connectedMedias[index] = { id: String(media.id), client }
    }
    console.log(this.connectedMedias, 'sss')
    client.emit('connect', '连接成功')
  }

  async handleDisconnect(client) {
    const media: any = await this.jwtService.verify(
      client.handshake.query.token,
    )
    const mediaExist = await this.mediaService.findById(media.id)
    if (!mediaExist) {
      return
    }
    this.connectedMedias = this.connectedMedias.filter(v => v.id !== String(mediaExist.id))
    console.log(this.connectedMedias, 'mediaExist')
    console.log(111)

  }

  @SubscribeMessage('message')
  async sendMessage(id: string, message: IMessage) {
    let client: any = null
    this.connectedMedias.map(media => {
      if (media.id === id) {
        client = media.client
      }
    })
    if (!client) {
      return
    }
    client.emit('message', message)
  }
}

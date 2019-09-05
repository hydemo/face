import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
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
    private readonly mediaService: MediaService,
  ) { }

  async handleConnection(client) {
    const token = client.handshake.query.token;
    console.log(token, 'token')
    const media: any = await this.mediaService.findByToken(token)
    if (!media) {
      return
    }
    const index = this.connectedMedias.findIndex(v => v.id === String(media._id))
    if (index < 0) {
      this.connectedMedias = [...this.connectedMedias, { id: String(media._id), client }];
    } else {
      this.connectedMedias[index] = { id: String(media._id), client }
    }
    client.emit('connect', '连接成功')
  }

  async handleDisconnect(client) {
    const token = client.handshake.query.token;
    const media: any = await this.mediaService.findByToken(token)
    if (!media) {
      return
    }
    this.connectedMedias = this.connectedMedias.filter(v => v.id !== String(media._id))

  }

  @SubscribeMessage('message')
  async sendMessage(id: string, message: IMessage) {
    let client: any = null
    console.log(id, 'id')
    this.connectedMedias.map(media => {
      if (media.id === id) {
        client = media.client
      }
    })
    if (!client) {
      return
    }
    console.log(client, 'client')
    client.emit('message', message)
  }
}

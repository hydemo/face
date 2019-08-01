import { Injectable, NestInterceptor, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly redis: RedisService
  constructor() {

  }
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    const client = this.redis.getClient()
    const request = context.switchToHttp().getRequest();
    const url = request.originalUrl
    const ip = request.headers['x-real-ip'] ? request.headers['x-real-ip'] : request.ip.replace(/::ffff:/, '');
    Logger.log(url);
    if (url.indexOf('/faceinfo') === -1 && url.indexOf('/keepalive') === -1) {
      Logger.log(request.method);
      Logger.log(ip);
      Logger.log(request.params);
      Logger.log(request.query)
      const body = { ...request.body }
      delete body.img;
      delete body.imgex;
      Logger.log(body);
      client.hincrby('Log_IP', ip, 1)
    }
    const now = Date.now();
    return call$.pipe(
      tap(() => Logger.log(`Complete... ${Date.now() - now}ms`)),
    );
  }
}
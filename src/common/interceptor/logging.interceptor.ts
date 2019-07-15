import { Injectable, NestInterceptor, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const url = request.originalUrl
    Logger.log(url);
    if (url !== 'faceinfo' && url !== '/keepalive') {
      Logger.log(request.method);
      Logger.log(request['x-real-ip']);
      Logger.log(request.params);
      Logger.log(request.query)
      const body = { ...request.body }
      delete body.img;
      delete body.imgex;
      Logger.log(body);
    }
    const now = Date.now();
    return call$.pipe(
      tap(() => Logger.log(`Complete... ${Date.now() - now}ms`)),
    );
  }
}
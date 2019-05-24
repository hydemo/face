import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ApiException } from '../expection/api.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    Logger.error(exception);
    if (exception instanceof ApiException) {

      response
        .status(exception.getStatus())
        .json({
          statusCode: exception.getErrorCode(),
          message: exception.getErrorMessage(),
          date: new Date().toLocaleDateString(),
          path: request.url,
        });

    } else if (exception instanceof HttpException) {

      response
        .status(exception.getStatus())
        .json({
          statusCode: exception.getStatus(),
          date: new Date().toLocaleDateString(),
          path: request.url,
          message: exception.message,
        });

    } else {

      response
        .status(500)
        .json({
          statusCode: 500,
          message: '服务器异常',
          date: new Date().toLocaleDateString(),
          path: request.url,
        });

    }
  }
}
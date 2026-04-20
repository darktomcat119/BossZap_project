import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        code = (resp.error as string) || code;
        if (Array.isArray(resp.message)) {
          details = resp.message;
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      // Non-HTTP exceptions are unexpected — log with stack
      this.logger.error(
        `${request.method} ${request.url} → 500: ${exception.message}`,
        exception.stack,
      );
    }

    if (exception instanceof HttpException && status >= 400) {
      const detailStr = details.length ? ` ${JSON.stringify(details)}` : '';
      const level = status >= 500 ? 'error' : 'warn';
      this.logger[level](
        `${request.method} ${request.url} → ${status} ${code}: ${message}${detailStr}`,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  }
}

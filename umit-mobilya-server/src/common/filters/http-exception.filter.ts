import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorBody {
  statusCode: number;
  message: string;
  errors?: string[];
  path: string;
}

/**
 * One error shape for every failure path.
 *
 * The Express version returned three different shapes — `{ message }` 24
 * times, `{ errors }` twice, `{ error }` twice — so a client could not write a
 * single error handler. See .claude/rules/06-validation-and-errors.md.
 *
 * `errors[]` carries the per-field messages a ValidationPipe produces; it is
 * absent on failures that have nothing field-specific to say.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode: status,
      message: this.resolveMessage(exception),
      path: request.url,
    };

    const fieldErrors = this.resolveFieldErrors(exception);
    if (fieldErrors) {
      body.errors = fieldErrors;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return payload;
      }
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        /*
         * class-validator returns one string per failed constraint, in
         * decorator-evaluation order — which is bottom-up, so `message[0]`
         * would surface "name must be shorter than 120 characters" for a
         * field that was simply missing. The frontend puts this straight into
         * a toast, so all of them are joined instead of picking one at random.
         */
        return message.map(String).join(', ');
      }
      return exception.message;
    }

    return 'Beklenmeyen bir hata oluştu.';
  }

  private resolveFieldErrors(exception: unknown): string[] | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return undefined;
    }

    const message = (payload as { message?: unknown }).message;
    return Array.isArray(message) && message.length > 1
      ? message.map(String)
      : undefined;
  }
}

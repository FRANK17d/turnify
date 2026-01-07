import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal Server Error';

        // Log del error (útil si Sentry falla o para logs locales)
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `Error ${status} at ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );

            // Enviar errores 500 a Sentry
            if (exception instanceof Error) {
                Sentry.captureException(exception, {
                    extra: {
                        url: request.url,
                        method: request.method,
                        body: request.body,
                        query: request.query,
                        headers: request.headers,
                    },
                });
            }
        } else {
            this.logger.warn(
                `Error ${status} at ${request.method} ${request.url}: ${JSON.stringify(message)}`,
            );
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: typeof message === 'string' ? message : (message as any).message || message,
        });
    }
}

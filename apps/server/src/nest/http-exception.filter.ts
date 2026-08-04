import { ArgumentsHost, Catch, ExceptionFilter, HttpException, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AxiosError } from 'axios';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    if (exception instanceof NotFoundException) response.redirect('/');
    else {
      const status = exception.getStatus();
      let originalResponseBody: string | undefined;

      if (exception.cause instanceof Object && (exception.cause as AxiosError).response?.data) {
        try {
          originalResponseBody = JSON.parse((exception.cause as AxiosError).response?.data as string);
        } catch {
          // `exception.cause` must not be valid JSON, so it's probably not something we want to
          // include in the `cause` of our response. Instead, we'll just swallow the SyntaxError and
          // continue with an undefined `originalResponseBody`
        }
      }

      // This filter picks up 403 errors, which get triggered
      // when the SessionGuard returns false.  However, in the
      // SessionGuard, we handle the 403 by trying to log the
      // user in via sso, which includes a redirect.  Once a
      // redirect is triggered, you can't send another response
      // back to the browser, so this ended up throwing
      // "Error: Cannot set headers after they are sent to the client".
      // Hence, check to make sure we haven't already sent a response.
      if (!response.headersSent)
        response.status(status).json({
          message: exception.getResponse(),
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          cause: originalResponseBody,
        });
    }
  }
}

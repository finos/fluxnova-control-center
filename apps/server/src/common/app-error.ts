/**
 * This should used whenever rethrowing an error. It will result in the original stack trace being
 * kept and recorded in logs/traces.
 *
 * https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md#use-only-the-built-in-error-object
 */
import { HttpException, HttpExceptionOptions, HttpStatus } from '@nestjs/common';

export class FluxnovaError extends HttpException {
  constructor(description: string, options?: HttpExceptionOptions, status?: HttpStatus) {
    super(description, status || HttpStatus.INTERNAL_SERVER_ERROR, options);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    Error.captureStackTrace(this);
  }
}

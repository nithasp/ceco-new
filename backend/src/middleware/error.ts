import { NextFunction, Request, Response } from 'express';
import { MysqlError } from '../types/database.types';
import { ErrorCode, HandledError } from '../types/error.types';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

// MySQL reports a broken constraint as a numbered error; each one is turned into the status and
// wording a client can act on, without echoing the statement that failed
function fromMysql(err: MysqlError): HandledError | null {
  switch (err.errno) {
    case 1062: {
      const message = err.sqlMessage ?? '';
      return {
        statusCode: 409,
        code: 'conflict',
        message: /username/i.test(message)
          ? 'Username already exists'
          : /headers_locale|uniq_header_locale/i.test(message)
            ? 'A header already exists for that language'
            : /experience/i.test(message)
              ? 'That table already exists for this language'
              : 'A record with that value already exists',
      };
    }
    case 1452:
      return {
        statusCode: 400,
        code: 'invalid_request',
        message: 'A referenced record does not exist',
      };
    case 1451:
      return {
        statusCode: 409,
        code: 'conflict',
        message: 'This record is used elsewhere and cannot be deleted',
      };
    case 3819:
      return { statusCode: 400, code: 'invalid_request', message: 'A value is not allowed here' };
    case 1406:
      return { statusCode: 400, code: 'invalid_request', message: 'A value is too long' };
    case 1264:
      return { statusCode: 400, code: 'invalid_request', message: 'A number is out of range' };
    case 1366:
    case 1265:
      return { statusCode: 400, code: 'invalid_request', message: 'A value has an invalid format' };
    case 1205:
    case 1213:
      return {
        statusCode: 409,
        code: 'conflict',
        message: 'The request collided with another one, please try again',
      };
    default:
      return null;
  }
}

// multer reports a file that is too large or a field it did not expect through its own code
function fromMulter(err: { code?: string | undefined }): HandledError | null {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return { statusCode: 413, code: 'payload_too_large', message: 'The file is larger than the limit' };
    case 'LIMIT_FILE_COUNT':
      return { statusCode: 400, code: 'invalid_request', message: 'Too many files in one request' };
    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        code: 'invalid_request',
        message: "The file must be sent in a field named 'file'",
      };
    default:
      return null;
  }
}

export const notFoundMiddleware = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.method} ${req.path} not found`, 'not_found');
};

// Unexpected errors (database failures, bugs) are logged server-side and never echoed to the client,
// so stack traces, SQL and internal paths don't leak (OWASP API8)
export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const known = err as AppError & { status?: number; type?: string; code?: string };
  const db = known instanceof AppError ? null : fromMysql(err as MysqlError);
  const upload = known instanceof AppError ? null : fromMulter(known);
  const handled = db ?? upload;
  const statusCode = handled?.statusCode ?? known.statusCode ?? known.status ?? 500;

  if (statusCode >= 500) {
    req.log.error({ err }, 'request failed');
    sendError(res, statusCode, 'Internal Server Error', 'internal_error');
    return;
  }

  if (handled) {
    sendError(res, handled.statusCode, handled.message, handled.code);
    return;
  }

  const bodyParserMessage =
    known.type === 'entity.parse.failed'
      ? 'Request body must be valid JSON'
      : known.type === 'entity.too.large'
        ? 'Request body is too large'
        : null;

  sendError(
    res,
    statusCode,
    bodyParserMessage ?? (err.message || 'Request failed'),
    bodyParserMessage ? 'invalid_request' : ((known.code as ErrorCode | undefined) ?? 'bad_request'),
  );
};

/**
 * CubiO AI — FUNNEL 06: Request Validation Middleware
 *
 * Validates incoming API request payload size and structure.
 * Rejects malformed, oversized, and structurally invalid chat requests.
 *
 * Env vars:
 *   CUBIO_MAX_REQUEST_BYTES — max body size in bytes (default: 65536 = 64KB)
 *   CUBIO_MAX_MESSAGES      — max messages array length (default: 100)
 */

import { Request, Response, NextFunction } from 'express';

const MAX_BYTES = parseInt(process.env.CUBIO_MAX_REQUEST_BYTES || '65536', 10);
const MAX_MESSAGES = parseInt(process.env.CUBIO_MAX_MESSAGES || '100', 10);

/**
 * Enforces a maximum request body byte size.
 * Must run BEFORE express.json() parser or alongside it.
 */
export function requestSizeGuard() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_BYTES) {
      res.status(413).json({
        error: 'Payload Too Large',
        code: 'REQUEST_TOO_LARGE',
        maxBytes: MAX_BYTES,
      });
      return;
    }
    next();
  };
}

/**
 * Validates /api/cubio/chat payload structure.
 * Rejects requests missing required fields or with invalid types.
 */
export function chatRequestValidator() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body;

    // Must be a non-null object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Bad Request', code: 'INVALID_BODY', detail: 'Request body must be a JSON object.' });
      return;
    }

    // messages must be present and an array
    if ('messages' in body) {
      if (!Array.isArray(body.messages)) {
        res.status(400).json({ error: 'Bad Request', code: 'INVALID_MESSAGES', detail: 'messages must be an array.' });
        return;
      }
      if (body.messages.length > MAX_MESSAGES) {
        res.status(400).json({
          error: 'Bad Request',
          code: 'TOO_MANY_MESSAGES',
          detail: 'messages array exceeds maximum length.',
          max: MAX_MESSAGES,
        });
        return;
      }
      // Each message must have role + content strings
      for (let i = 0; i < body.messages.length; i++) {
        const msg = body.messages[i];
        if (!msg || typeof msg !== 'object') {
          res.status(400).json({ error: 'Bad Request', code: 'INVALID_MESSAGE', detail: 'Each message must be an object.', index: i });
          return;
        }
        if (typeof msg.content !== 'string') {
          res.status(400).json({ error: 'Bad Request', code: 'INVALID_MESSAGE_CONTENT', detail: 'message.content must be a string.', index: i });
          return;
        }
      }
    }

    next();
  };
}

import { HttpErrorResponse } from '@angular/common/http';

// The API answers every failure with { message, code }, so that message is what the editor should
// read. Anything else (the API being down, a CORS problem) gets a sentence that says so.
export function describeError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Could not reach the API. Check that the backend is running.';
    }
    const message = (error.error as { message?: string } | null)?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (error.status === 413) return 'That file is too large.';
    if (error.status === 415) return 'That file type is not accepted.';
  }
  return fallback;
}

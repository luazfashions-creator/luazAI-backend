/* eslint-disable @typescript-eslint/no-empty-object-type */
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      [key: string]: unknown;
    };
    traceId?: string;
  }
}

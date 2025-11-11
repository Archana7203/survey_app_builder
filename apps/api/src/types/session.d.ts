import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id?: string;
      oid: string;
      name: string;
      email: string;
    };
    [key: string]: any;
  }
}

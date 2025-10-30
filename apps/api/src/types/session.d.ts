import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      oid: string;
      name: string;
      email: string;
    };
    [key: string]: any;
  }
}

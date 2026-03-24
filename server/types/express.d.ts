import "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        userId?: string;
        email?: string;
      };
      rawBody?: Buffer;
    }
  }
}

export {};

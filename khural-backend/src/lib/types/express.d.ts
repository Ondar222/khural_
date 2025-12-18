import type { IAccountability } from './accountability';

declare module 'express-serve-static-core' {
  export interface Request {
    token: string | null;
    collection: string;
    schema: SchemaOverview;

    accountability?: IAccountability;
    providers: Record<string, any>;
    singleton?: boolean;

    files: Express.Multer.File[];
  }

  namespace Multer {
    export interface File {
      width?: number;
      height?: number;
      extname?: string;
    }
  }
}

export {};

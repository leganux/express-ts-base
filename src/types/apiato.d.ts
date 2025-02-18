declare module 'apiato' {
  import { Model, Document } from 'mongoose';
  import { Request, Response } from 'express';

  type ValidationTypes = 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  interface ValidationObject {
    [key: string]: ValidationTypes;
  }

  interface ApiatoOptions {
    customErrorCode?: number;
    customValidationCode?: number;
    customNotFoundCode?: number;
    mongooseOptions?: {
      new?: boolean;
      runValidators?: boolean;
      [key: string]: any;
    };
    updateFieldName?: string;
  }

  interface PopulationObject {
    [key: string]: string;
  }

  interface ApiatoConfig {
    database: 'nosql' | 'sql';
    prefix?: string;
    hideLogo?: boolean;
  }

  interface ApiatoResponse<T> {
    error: any;
    success: boolean;
    message: string;
    code: number;
    data: T;
  }

  type PreExecutionHook = (req: Request) => Promise<Request>;
  type PostExecutionHook<T> = (data: T) => Promise<T>;

  export class Apiato {
    constructor(config: ApiatoConfig);

    createOne<T extends Document>(
      model: Model<T>,
      validationObject: ValidationObject,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    getMany<T extends Document>(
      model: Model<T>,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T[]>
    ): (req: Request, res: Response) => Promise<Response>;

    getOneById<T extends Document>(
      model: Model<T>,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    getOneWhere<T extends Document>(
      model: Model<T>,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    updateById<T extends Document>(
      model: Model<T>,
      validationObject: ValidationObject,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    findIdAndDelete<T extends Document>(
      model: Model<T>,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    findUpdateOrCreate<T extends Document>(
      model: Model<T>,
      validationObject: ValidationObject,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    findUpdate<T extends Document>(
      model: Model<T>,
      validationObject: ValidationObject,
      populationObject?: PopulationObject | null,
      options?: ApiatoOptions,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T>
    ): (req: Request, res: Response) => Promise<Response>;

    datatable<T extends Document>(
      model: Model<T>,
      populationObject?: PopulationObject | null,
      searchFields?: string[] | string,
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T[]>
    ): (req: Request, res: Response) => Promise<Response>;

    datatable_aggregate<T extends Document>(
      model: Model<T>,
      pipeline?: any[],
      searchFields?: string[] | string,
      options?: {
        allowDiskUse?: boolean;
        search_by_field?: boolean;
      },
      preHook?: PreExecutionHook,
      postHook?: PostExecutionHook<T[]>
    ): (req: Request, res: Response) => Promise<Response>;

    aggregate<T extends Document>(
      model: Model<T>,
      pipeline?: any[],
      options?: {
        allowDiskUse?: boolean;
      },
      preHook?: PreExecutionHook,
      midHook?: (pipeline: any[]) => Promise<any[]>,
      postHook?: PostExecutionHook<T[]>
    ): (req: Request, res: Response) => Promise<Response>;
  }
}

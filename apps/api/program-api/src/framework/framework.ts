import { AnyZodObject, z } from 'zod';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// https://davidtimms.github.io/programming-languages/typescript/2020/11/20/exploring-template-literal-types-in-typescript-4.1.html
export type HttpVerbs = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

const makeRoute = <Path extends string, Verb extends HttpVerbs>(path: Path, verb: Verb): `${Verb}.${Path}` => {
  return `${verb}.${path}` as `${Verb}.${Path}`;
};

export const makePost = <Path extends string>(path: Path) => makeRoute(path, 'post');
export const makeGet = <Path extends string>(path: Path) => makeRoute(path, 'get');
export const makePut = <Path extends string>(path: Path) => makeRoute(path, 'put');
export const makeDelete = <Path extends string>(path: Path) => makeRoute(path, 'delete');
export const makePath = <Path extends string>(path: Path) => makeRoute(path, 'patch');

// export const TestRequest = z.object({
//     body: z.object({
//       programs: z.array(AnnualProgram),
//     }),
//     params: z.object({
//       annualProgramId: z.string(),
//     }),
//     query: z.object({
//       aa: z.string(),
//       bb: z.number(),
//     })
//   });
//   export type TestRequest = z.infer<typeof TestRequest>;

//   export const TestRequest1 = z.object({
//     query: z.object({
//       aa: z.string(),
//       bb: z.number(),
//     }),
//   });
//   export type TestRequest1 = z.infer<typeof TestRequest1>;

type GetBodyKey<TRequest> = TRequest extends { body: any } ? TRequest['body'] : never;
type GetParamKey<TRequest> = TRequest extends { params: any } ? TRequest['params'] : never;
type GetQueryKey<TRequest> = TRequest extends { query: any } ? TRequest['query'] : never;

// type B1 = GetBodyKey<CreateAnnualProgramRequest>;
// type B2 = GetBodyKey<TestRequest>;

// type B3 = GetParamKey<CreateAnnualProgramRequest>;
// type B4 = GetParamKey<TestRequest>;

// type B5 = GetQueryKey<CreateAnnualProgramRequest>;
// type B6 = GetQueryKey<TestRequest>;

type ParametersFromRequest<TRequest> = {
  [B in keyof GetBodyKey<TRequest>]: GetBodyKey<TRequest>[B];
} & {
  [P in keyof GetParamKey<TRequest>]: GetParamKey<TRequest>[P];
} & {
  [Q in keyof GetQueryKey<TRequest>]: GetQueryKey<TRequest>[Q];
};

type CleanEmpty<T extends Record<string, any>> = { [K in keyof T]: T[K] };

// type P = CleanEmpty<ParametersFromRequest<GetAnnualProgramRequest>>;

export type DeclareServiceHandler<TRequest, TOutput, TKey extends string> = {
  [K in TKey]: (args: CleanEmpty<ParametersFromRequest<TRequest>>) => Promise<TOutput>;
};

// type PartialService1 = DeclareServiceHandler<TestRequest, number[], 'my-handler'>;
// type PartialService2 = DeclareServiceHandler<CreateAnnualProgramRequest, AnnualProgram[], 'annual-program.create'>;

// type makeServiceWithHandlers =
//   DeclareServiceHandler<TestRequest, number[], 'test-handler-1'> &
//   DeclareServiceHandler<TestRequest1, AnnualProgram[], 'test-handler-2'>;

// type MyTestService = makeServiceWithHandlers

// const createMyTestService = (): MyTestService => {
//   return {
//     'test-handler-1': ({annualProgramId}) => {
//       console.log(annualProgramId)
//       return Promise.resolve([1]);
//     },

//     'test-handler-2': ({aa, bb}) => {
//       console.log(aa, bb)
//       return Promise.resolve([]);
//     }
//   };
// };

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body, query, params } = req;
    await schema.parseAsync({
      body,
      query,
      params,
    });
    return next();
  } catch (error) {
    return res.status(422).json(error);
  }
};

export const createFunctionBuilder = <T extends Record<string, (...args: any[]) => Promise<any>>>(
  service: T,
  key: keyof T
): ((req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response): Promise<any> => {
    // get everything required here then call service
    const { body, query, params } = req;

    const args = {
      ...body,
      ...query,
      ...params,
    };

    return res.json(await service[key](args));
  };
};

export type Routes = Record<
  string,
  {
    middlewares: RequestHandler[];
    handler: RequestHandler;
  }
>;

import { AnnualProgram, ProgramBook } from '@ahryman40k/types/program-api-types';
import express from 'express';
import path from 'path';
import http from 'http';
import { ServerConfig, createServerConfiguration } from './config';

// Is a key a valid splitable data
const SplittableKey = 'annual-program.create';
type Splitable<S extends string> = S extends `${infer domain}.${infer action}`
  ? [domain, action]
  : { error: 'Not a splitable key' };
type SplittedKey = Splitable<typeof SplittableKey>;
type SplittedKey2 = Splitable<'annual-program.create'>;
type SplittedKey3 = Splitable<'create'>;

const [domain, action] = SplittableKey.split('.') as SplittedKey;
/*
const Router = {
  'post./api/v1/annualProgram': {
    action: 'annual-program.create',
    middlewares: [],
    handler: () => { }
  },
  'get./api/v1/annualProgram1': {
    action: 'program.get',
    middlewares: [],
    handler: () => { }
  }
}

const result = Object.keys(Router).map(r => {
  const [method, path] = SplittableKey.split('.') as Splitable<keyof typeof Router>
  return {npm start
    method,
    path
  }
})
*/

/*
type Actio/Context = {domain: string, action: string }
type ActionHandler<TInput, TOutput = TInput> = ( context: ActionContext, item: TInput) => Promise<TOutput | null>;

const SampleActionHandler: ActionHandler<AnnualProgram, AnnualProgram> = async ( context, item: AnnualProgram) => null 


interface ActionMap {
  [k: string ]: ActionHandler
}

const SampleActionMap = {
  'aaa': async <AnnualProgram>( context, item) => {
    console.log(context, item)
    return null;
  }  ,
  'bbb': async <typeof z.string, Program>( context, item) => null,
}
*/

// type SystemActions<T extends ZodTypeAny> =  Record<string, SystemActionHandler<z.infer<T>>>
// type SystemActions<T extends ZodTypeAny, S extends string> = Splitable<S> extends [string, string] ?
//      SystemActionHandler<S, T> : never;

/*
type System<
T extends ZodTypeAny,
S extends string,
A extends Record<S, SystemActionHandler<S, z.infer<T>>>,
AL extends keyof A
> =
  {
    schema: T,
    actions: A
  }


const system = <T extends ZodTypeAny, S extends string, A extends  Record<S, SystemActionHandler<S, z.infer<T>>> >(schema: T, actions: A): System<T, S, A, keyof A> => ({
  schema,
  actions,
})
*/
/*
const system = <T extends ZodTypeAny> (actions: { actionKey: string, handler, ActionHandler<z.infer<T>>}[]) => {

}
*/

const createSystemA = (config: ServerConfig) => {
  // Could be mongo
  console.log('connnected with System A thanks to ', config);
  return {
    'annual-program.create': async (
      context: any,
      args: { items: AnnualProgram[] }
    ): Promise<AnnualProgram[] | null> => {
      console.log(`'annual-program.create' was called`);
      return args.items;
    },
    'annual-program.update': async (
      context: any,
      args: { items: AnnualProgram[] }
    ): Promise<AnnualProgram[] | null> => {
      console.log(`'annual-program.update' was called`);
      return args.items;
    },
    'annual-program.getByIds': async (context: any, args: { ids: string[] }): Promise<AnnualProgram[] | null> => {
      console.log(`'annual-program.update' was called`);
      return null;
    },
  };
};

// type GetSystemActionList<T> = T extends System<any, any, infer keys> ? keys : never
// type ActionsInSystemA = GetSystemActionList<ReturnType<typeof createSystemA>>

const createSystemB = (config: ServerConfig) => {
  // could be any other data storage. That's for demo purpose
  console.log('connnected with System B thanks to ', config);

  return {
    'program-book.getAll': async (context: any, args: {}): Promise<ProgramBook[] | null> => {
      console.log(`'program-book.getAll' was called`);
      return [];
    },
  };
};

const createSystems = (config: ServerConfig) => {
  const systems = {
    ...createSystemA(config),
    ...createSystemB(config),
  };
  console.log('All Systems created');
  console.log('Systems validated');

  return systems;
};

// Systems type

type SystemType = ReturnType<typeof createSystems>;
type ExposedSystemActions = keyof SystemType;

// Domain type

const sampleAnnualProgramValue: AnnualProgram = {
  executorId: 'abc',
  year: 2022,
  budgetCap: 500,
  status: 'new',
};

const createDomainServiceA = (systems: SystemType) => {
  console.log('Domain AnnualProgram created');
  return {
    'annual-program.create': async (args: {
      description: string,
      year: number,
      budgetCap: number,
      executorId: string,
    }) => {
      // Do checks
      /*
    const result = pipe (
      item
      ApplyRule1
      ApplyRule2
      ...
      ApplyRuleN
    )


    Either left or right
    */
      console.log("Inputs validated")
      console.log("Business rules validated")

      // call system
      return systems['annual-program.create']({}, { items: [sampleAnnualProgramValue] });
    },
    'annual-program.getByIds': async (args: { ids: string[] }) => {
      // return systems['annual-program.getByIds']( {}, { ids: args.ids  })
    },
  };
};

const createDomainServiceB = (systems: SystemType) => {
  console.log('Domain B created');
  return {
    'program-book.update': async (args: {}) => {
      return null;
    },
  };
};

const createDomains = (systems: SystemType) => {
  const domains = { ...createDomainServiceA(systems), ...createDomainServiceB(systems) };
  console.log('All domains created');
  console.log('domains validated');

  return domains
};

type Domains = ReturnType<typeof createDomains>;
type DomainKeyList = keyof ReturnType<typeof createDomains>;
type DomainList = Splitable<DomainKeyList>;

//----- Routing

type RouteHandler = () => void;

interface Router {
  [k: string]: {
    middlewares: express.RequestHandler[];
    handler: RouteHandler;
  };
}

// Use method to enforce key format
const makeRouterKey = (method: 'post' | 'get' | 'delete' | 'put', path: string): [string] => [`${method}.${path}`];

// How describing routes
export const annual_program_routes = (domains: Domains): Router => ({
  [`post./api/v1/annualProgram`]: {
    middlewares: [],
    handler: () => {
      // Extract values from body, params, querystring
      // then call domain Service
      domains['annual-program.create']({ year: 2022, executorId: 'GBA', budgetCap: 500, description: 'undefined' });

      // deal with http errors

      // then return response to client
    },
  },
  [`${makeRouterKey('get', '/api/v1/annualProgram/:id')}`]: {
    middlewares: [],
    handler: () => {
      // Extract values from body, params, querystring
      // then call domain Service
      // deal with http errors
      // then return response to client
    },
  },
});

export const program_routes = (domains: Domains): Router => ({
  [`post./api/v1/program`]: {
    middlewares: [],
    handler: () => {
      // Extract values from body, params, querystring
      // then call domain Service
      // deal with http errors
      // then return response to client
    },
  },
  [`${makeRouterKey('get', '/api/v1/program/:id')}`]: {
    middlewares: [],
    handler: () => {
      // Extract values from body, params, querystring
      // then call domain Service
      // deal with http errors
      // then return response to client
      domains['program-book.update']({});
    },
  },
});

// Here is the final router object for all domains
const createRouter = (domains: Domains): Router => ({
  ...annual_program_routes(domains),
  ...program_routes(domains),
});

// type AppRouter = ReturnType<typeof createRouter>

//----- Starting the server
interface ServerApp {
  start: () => void;
  stop: () => void;
}

interface ServerStarter {
  createServer: (context: {
    // services,
    router: any;
  }) => ServerApp;
}

const fromExpress = (config: ServerConfig, initializer: (app: express.Express) => void): ServerStarter => {
  const app = express();
  initializer(app);

  let server: http.Server | null = null;

  const start = () => {
    console.log('Starting express server')
    const port = config.server.port || 6666;
    server = app.listen(port, () => {
      console.log(`Listening express server at http://localhost:${port}/api`);
    });
    server.on('error', console.error);
  };

  const stop = () => {
    if (server) server.close();
  };

  const prepareRoutes = (router: Router) => {
    Object.keys(router).forEach((key) => {
      const [method, path] = key.split('.') as [string, string];
      const { middlewares, handler } = router[key];

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore  [GBA]
      app[method](path, ...middlewares, handler);
    });

    app.get('/api', (req, res) => {
      res.send({ message: 'Welcome to project-api!' });
    });
  };

  const serverStartStop = {
    start,
    stop,
  };

  return {
    createServer: (context: { router: Router }) => {
      console.log('Prepare express server routes')
      prepareRoutes(context.router);
      console.log('express server routes set up')
      return serverStartStop;
    },
  };
};

const testConf: ServerConfig = createServerConfiguration();

const systems = createSystems(testConf);
const domains = createDomains(systems);

fromExpress(testConf, (app) => {
  console.log('Initialize express server')
  app.use(express.json());
  app.use('/assets', express.static(path.join(__dirname, 'assets')));
})
  .createServer({
    // services,
    router: createRouter(domains),
  })
  .start();

/*
type DomainActionFn<TInput, TOutput> = (input: TInput) => Promise<TOutput | null>

type SampleAction = DomainActionFn<{ id: string }, AnnualProgram>

type GetDomainInputType<T> = T extends DomainActionFn<infer TInput, any> ? TInput : never;
type GetDomainOutputType<T> = T extends DomainActionFn<any, infer TOuput> ? TOuput : never;

type SmapleActionInput = GetDomainInputType<SampleAction>
type SmapleActionOutput = GetDomainOutputType<SampleAction>



// interface DomainActions  { 'add': DomainActionFn<AnnualProgram, {id: string}> } 
type DomainActions = ['add', 'delete'];
type DomainActionsAsEnum = DomainActions[number]

type isDomainService<T> = T extends { [K: string]: DomainActionFn<any, any> } ? true : false;

type isAnnualProgramServiceADomainService = isDomainService<AnnualProgramService>





type BBB = keyof DomainActions;
type DDD = DomainActions['add']

type ZZZ = { [P in keyof DomainActions]: GetDomainOutputType<DomainActions[P]> }


type DomainService<T extends Record<string, DomainActionFn<AnnualProgram, AnnualProgram>>> = {
  [P in keyof T]: Promise<ReturnType<T[P]>>
}

type CCC = DomainService<DomainActions>

} as DomainService<DomainActions>

type KeysOfService<S extends Record<string, (...args: any) => any>> = keyof S
type ZZ = KeysOfService<AnnualProgramService>


interface Foo {
  attr: string;
  (a: string): number;
  (a: number): number;
}




type JustSignature<T extends (...a: any[]) => unknown> = (...a: Parameters<T>) => ReturnType<T>


type FooSignatures = JustSignatures<AnnualProgramService>
// type FooSignatures = {
//     (a: string): number;
//     (a: number): number;
// }

type AAA<S extends Record<string, (...args: any) => any>> = typeof S[]


type wrapperFn<S extends Record<string, (...args: any) => any>> = (service: S) => Promise<ReturnType<S> | null>
type A = wrapperFn<AnnualProgramService>



*/

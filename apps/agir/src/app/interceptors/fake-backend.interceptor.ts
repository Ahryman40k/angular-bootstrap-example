import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';


const endpoints = {
  [`/taxonomy/executors`]: {
    GET: () => ([
      { name: 'Executor-01' },
      { name: 'Executor-02' },
      { name: 'Executor-03' },
      { name: 'Executor-04'}
    ])
  } 
}

const createRouteHandler = (request: HttpRequest<unknown>, next: HttpHandler) => {
  const { url, method, headers, body } = request;
  return ({
    handleRoute: () => {
      // split url
      const pathname = new URL(url).pathname as keyof typeof endpoints;
      // get server path
      // test if a route exists
      // if so, invoke the function associated with the desired method  
      return endpoints[pathname][ method as 'GET' ]()

     /* switch (true) {
        case url.endsWith('/taxonomy/executors') && method === 'GET':  
        
        case url.endsWith('/users/authenticate') && method === 'POST':
              return authenticate();
          case url.endsWith('/users/register') && method === 'POST':
              return register();
          case url.endsWith('/users') && method === 'GET':
              return getUsers();
          case url.match(/\/users\/\d+$/) && method === 'GET':
              return getUserById();
          case url.match(/\/users\/\d+$/) && method === 'PUT':
              return updateUser();
          case url.match(/\/users\/\d+$/) && method === 'DELETE':
              return deleteUser();
          default:
              // pass through any requests not handled above
              return next.handle(request);
      }    */
    }
  })
}


@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // const { url, method, headers, body } = request;
    const response_body =  createRouteHandler(request, next).handleRoute()
    return of(new HttpResponse({ status: 200, body: response_body }))
  }
}

export const fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};
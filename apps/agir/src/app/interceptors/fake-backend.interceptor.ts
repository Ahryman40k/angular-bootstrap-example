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

import executorList from './executors.json'
import AnnualPrograms from './annual-programs.json'

const endpoints = {
  [`/taxonomy/executors`]: {
    GET: () => executorList
  },
  [`/annual_program`]: {
    GET: (/*annual_program: string*/ ) => AnnualPrograms
  }  
}

const createRouteHandler = (request: HttpRequest<unknown>, next: HttpHandler) => {
  const { url, method, headers, body } = request;
  return ({
    handleRoute: () => {
      const pathname = new URL(url).pathname as keyof typeof endpoints;
      return endpoints[pathname][ method as 'GET' ]()
    }
  })
}


@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
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
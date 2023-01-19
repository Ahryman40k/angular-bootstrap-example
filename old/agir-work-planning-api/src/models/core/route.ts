import { NextFunction, Request, Response } from 'express';

import { EndpointTypes } from '../../../config/constants';

/**
 * The http methods
 */
export enum HttpMethods {
  ALL, // All methods
  GET,
  POST,
  PUT,
  HEAD,
  DELETE,
  OPTIONS,
  TRACE,
  COPY,
  LOCK,
  MKCOL,
  MOVE,
  PURGE,
  PROPFIND,
  PROPPATCH,
  UNLOCK,
  REPORT,
  MKACTIVITY,
  CHECKOUT,
  MERGE,
  NOTIFY,
  SUBSCRIBE,
  UNSUBSCRIBE,
  PATCH,
  SEARCH,
  CONNECT
}

export function httpMethodFromString(methodStr: string): HttpMethods {
  if (methodStr) {
    const methodStrUp = methodStr.toUpperCase();
    return HttpMethods[methodStrUp];
  }
  return undefined;
}

/**
 * Converts a http method to its string representation.
 */
export function httpMethodToString(method: HttpMethods): string {
  if (isNaN(method)) {
    return undefined;
  }
  return HttpMethods[method];
}

/**
 * Converts a http method to its associated Express method name
 */
export function httpMethodtoExpressMethodName(method: HttpMethods): string {
  const name = httpMethodToString(method);
  return name ? name.toLowerCase() : name;
}

/**
 * The base informations of a route.
 */
export interface IRoute {
  /**
   * The HTTP method
   */
  method: HttpMethods;

  /**
   * The *relative* path of the route
   * Example : "/users/search"
   *
   * This path will be automatically prefixed with the
   * root for the endpoint type and by
   * the common domain path.
   */
  path: string;

  /**
   * The type of endpoint. This will affect the
   * root of the generated full path to the endpoint.
   *
   * Defaults to "API".
   */
  endpointType?: EndpointTypes;
}

/**
 * The informations required to build a route, including
 * the handler and the potential middlewares specific to the
 * route.
 */
export interface IHandlerRoute extends IRoute {
  /**
   * The handler function to manage requests to this route.
   */
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

  /**
   * Optional. Middlewares to use with this route.
   */
  middlewares?: ((req: Request, res: Response, next: NextFunction) => void)[];
}

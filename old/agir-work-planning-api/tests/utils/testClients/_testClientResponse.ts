import * as request from 'superagent';

export interface ITestClientResponse<TBody> extends request.Response {
  body: TBody;
}

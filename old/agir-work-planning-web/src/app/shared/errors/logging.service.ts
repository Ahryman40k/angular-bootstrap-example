import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  public logError(error: any): void {
    // Send errors to be saved here
    // TODO: Use a real logging mechanism for server side reporting.
    // tslint:disable-next-line: no-console
    console.error(error); // nosonar
  }
}

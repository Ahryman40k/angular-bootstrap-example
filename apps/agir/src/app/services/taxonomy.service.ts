import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class TaxonomyService {

  constructor( private http: HttpClient) { }

  executors() {
    return this. http.get<{name: string}[]>( 'http://localhost/taxonomy/executors')
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class AnnualProgramService {

  constructor( private http: HttpClient) { }

  annual_program_byId( programId: string ) {
    return this. http.get<{ name: string, status: string }[]>( `http://localhost/annual_program` /*${programId}`*/)
  }
}

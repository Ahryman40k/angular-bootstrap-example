declare namespace NodeJS {
  export interface global {
    __MONGO_URI__: string;
    __MONGO_DB_NAME__: string;
  }
}

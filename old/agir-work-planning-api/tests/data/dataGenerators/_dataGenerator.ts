export interface IEnrichedCreation<TEnriched> {
  /**
   * Creates an enriched data in memory and returns it.
   * @param partial A partial data to extend the base generated data.
   */
  createEnriched(partial?: Partial<TEnriched>): TEnriched;
}

export interface IPlainCreation<TPlain> {
  /**
   * Creates a plain data in memory and returns it.
   * @param partial A partial data to extend the base generated data.
   */
  createPlain(partial?: Partial<TPlain>): TPlain;
}

export interface IPlainFromEnrichedCreation<TEnriched, TPlain> {
  /**
   * Creates a plain data from and enriched data.
   * @param enriched The enriched data.
   */
  createPlainFromEnriched(enriched: TEnriched): TPlain;
}

export interface IEnrichedStorable<TEnriched> {
  /**
   * Stores an enriched data in the database and returns it.
   * @param partial A partial data to extend the base generated data.
   */
  store(partial?: Partial<TEnriched>): Promise<TEnriched>;
}

export interface IDataGenerator<TEnriched, TPlain>
  extends IEnrichedCreation<TEnriched>,
    IPlainCreation<TPlain>,
    IPlainFromEnrichedCreation<TEnriched, TPlain>,
    IEnrichedStorable<TEnriched> {}

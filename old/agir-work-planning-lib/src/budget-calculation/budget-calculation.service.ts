export interface IBudgetCalculationService<T> {
  calculate(object: T): void;
}

export interface IUseCase<K, L> {
  execute(request?: K): Promise<L> | L;
}

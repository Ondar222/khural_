export interface Clonable<T> {
  clone(id: number): Promise<T>;
}

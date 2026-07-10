/** @internal Await a value that may or may not be a Promise. */
export async function awaitMaybe<T>(v: T | Promise<T>): Promise<T> {
  return await Promise.resolve(v)
}

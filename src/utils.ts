export function toJSON<T>(res: Response) {
  let data: Promise<any>;

  if (res.status === 204) {
    data = Promise.resolve();
  } else {
    data = res.json();
  }

  return data as Promise<T>;
}

// from https://dev.to/smeijer/a-typescript-valueof-implementation-and-how-it-s-built-4gim#:~:text=Typescript%20does%20not%20have%20a%20valueof%20helper%2C%20but,have%20the%20keys%2C%20we%20can%20get%20the%20values.
export type ValueOf<T> = T[keyof T];

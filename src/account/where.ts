/**
 * Where the reader is, in the form the address bar shows.
 *
 * A bug is worth half as much without it: "the picture will not move" needs
 * to say which page it would not move on. Read at the moment of writing
 * rather than held, because the sheet is opened from wherever somebody is.
 */
export const whereNow = (): string =>
  `${window.location.pathname}${window.location.hash}` || '/'

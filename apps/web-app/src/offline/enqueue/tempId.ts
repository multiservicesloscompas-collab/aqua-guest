export const generateTempId = (): string =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

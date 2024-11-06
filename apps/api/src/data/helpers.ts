export function dataToDBData(lookup: { [P: string]: string }, data: Record<string, any>) {
  return Object.keys(data).reduce(
    (dbData, key) => {
      const dbKey = lookup[key];
      if (dbKey) {
        dbData[dbKey] = data[key as keyof typeof data];
      }
      return dbData;
    },
    {} as Record<string, any>,
  );
}

export function lookupToReturning(lookup: { [P: string]: string }): string {
  return Object.entries(lookup)
    .map(([key, dbKey]) => {
      if (key === dbKey) {
        return dbKey;
      }
      return `${dbKey} as "${key}"`;
    })
    .join(', ');
}

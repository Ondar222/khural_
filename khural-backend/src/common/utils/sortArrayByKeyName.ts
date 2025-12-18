const sortArrayByKeyName = (array: Array<{ [key: string]: any }>) => {
  const result: string[] = [];
  array.forEach((item) => {
    const entries = Object.entries(item);
    if (typeof entries[0][1] != 'object') {
      result.push(entries[0][0]);
    }
  });
  return result.sort();
};

export { sortArrayByKeyName };

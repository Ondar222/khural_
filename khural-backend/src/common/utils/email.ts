const genDefaultEmail = () => {
  const now = Date.now();
  return `default${now}@yurta.site`;
};

export { genDefaultEmail };

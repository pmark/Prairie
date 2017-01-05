const numDataPoints = 50;
const randomNum = () => Math.floor(Math.random() * 1000);
const randomDataSet = () => {
  return Array.apply(null, {length: numDataPoints}).map(() => [randomNum(), randomNum(), Math.floor(Math.random() * 10)]);
}

export const randomizeData = () => {
  return { data: randomDataSet() };
};

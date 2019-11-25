export default async function stringToArr(string) {
  const arr = string.split(/[\s,]+/);
  return arr;
}

export function stringToArr(string) {
  const arr = string.split(/[\s,]+/);
  return arr;
}

export function generateId(string) {
  const random = `f${(+new Date()).toString(16)}`;
  return string ? string + random : random;
}

export function objectAssign(sourceObj, mutableObj) {
  const result = Object.assign(sourceObj, mutableObj);
  return result;
}

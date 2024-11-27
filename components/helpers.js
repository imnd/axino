const camelToKebab = str => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());

const camelToSnake = str => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "_" : "") + $.toLowerCase());

const isObject = x => typeof x === 'object' && !Array.isArray(x) && x !== null;

const clone = obj => Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);

export { camelToKebab, camelToSnake, isObject, clone };

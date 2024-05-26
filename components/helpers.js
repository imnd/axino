const camelToKebab = str => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());
const isObject = x => typeof x === 'object' && !Array.isArray(x) && x !== null;

export { camelToKebab, isObject };

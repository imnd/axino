export default class Dto {
  setData (model) {
    const attributes = model.getAttributes();
    for (const key in attributes) {
      this[key] = attributes[key];
    }

    return this;
  }
}

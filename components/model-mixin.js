import { Http404Error } from "../core/http-error.js";

class ModelMixin {
  model

  constructor (model) {
    this.model = model;
  }

  showOrFail(id) {
    const model = this.model.findByPk(id);
    if (model) {
      return model;
    } else {
      this.#notFound();
    }
  }

  updateOrFail (id, data) {
    const model = this.model.findByPk(id).then();
    if (model) {
      model.update(data);
    } else {
      this.#notFound();
    }
  }

  destroyOrFail (id) {
    const model = this.model.findByPk(id);
    if (model) {
      model.destroy();
    } else {
      this.#notFound();
    }
  }

  #notFound () {
    throw new Http404Error();
  }
}

const mix = model => {
  const mm = new ModelMixin(model);

  model.showOrFail = async id => mm.showOrFail(id);
  model.updateOrFail = async (id, data) => mm.updateOrFail(id, data);
  model.destroyOrFail = async id => mm.destroyOrFail(id);
}

export default mix;

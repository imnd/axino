class CrudMixin {
  model

  constructor (model) {
    this.model = model;
  }

  /**
   * Create item
   */
  async create(data) {
    return await this.model.create(data);
  }

  /**
   * Get item by ID
   */
  async show(id) {
    return await this.model.showOrFail(id);
  }

  /**
   * Update item by ID
   */
  async update(id, data) {
    await this.model.updateOrFail(id, data);
    return await this.model.findByPk(id);
  }

  /**
   * Delete item
   */
  async destroy(id) {
    await this.model.destroyOrFail(id);
  }

  /**
   * Get all items
   */
  async index() {
    return await this.model.findAll();
  }
}

const mix = (controller, model)=> {
  const cm = new CrudMixin(model);

  controller.create = async data => cm.create(data);
  controller.show = async id => cm.show(id);
  controller.update = async (id, data) => cm.update(id, data);
  controller.destroy = async id => cm.destroy(id);
  controller.index = async id => cm.index(id);
}

export default mix;

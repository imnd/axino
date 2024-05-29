export default class CrudController {
  model;
  dto;

  constructor (model, dto) {
    this.model = model;
    this.dto = dto;
  }

  /**
   * Create item
   */
  async create(data) {
    const model = await this.model.create(data);

    return (new this.dto).setData(model);
  }

  /**
   * Get item by ID
   */
  async show(id) {
    const model = await this.model.findOrFail(id);

    return (new this.dto).setData(model);
  }

  /**
   * Update item by ID
   */
  async update(id, data) {
    await this.model.updateOrFail(id, data);

    return {
      result: "The model successfully updated",
    }
  }

  /**
   * Delete item by ID
   */
  async destroy(id) {
    await this.model.destroyOrFail(id);
  }

  /**
   * Get all items
   */
  async index() {
    const models = await this.model.findAll();
    const dtos = [];
    for (let model of models) {
      const dto = (new this.dto).setData(model);
      dtos.push(dto);
    }

    return dtos;
  }
}

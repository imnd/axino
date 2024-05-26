export default class CrudController {
  model

  constructor (model) {
    this.model = model;
  }


  /**
   * Create item
   */
  create(data) {
    return this.model.create(data);
  }

  /**
   * Get item by ID
   */
  show(id) {
    return this.model.findOrFail(id);
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
  index() {
    return this.model.findAll();
  }
}

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
    return this.model.showOrFail(id);
  }

  /**
   * Update item by ID
   */
  update(id, data) {
    this.model.updateOrFail(id, data);
    return this.model.findByPk(id);
  }

  /**
   * Delete item
   */
  destroy(id) {
    this.model.destroyOrFail(id);
  }

  /**
   * Get all items
   */
  index() {
    return this.model.findAll();
  }
}

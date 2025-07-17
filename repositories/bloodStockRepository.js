const BloodStock = require('../models/BloodStock');

class BloodStockRepository {
  async create(stockData) {
    return BloodStock.create(stockData);
  }
  async findByBloodTypeAndCity(bloodType, city) {
    return BloodStock.findOne({ bloodType, city });
  }
  async findById(id) {
    return BloodStock.findById(id);
  }
  async updateById(id, update) {
    return BloodStock.findByIdAndUpdate(id, update, { new: true });
  }
  async deleteById(id) {
    return BloodStock.findByIdAndDelete(id);
  }
  async findAll() {
    return BloodStock.find();
  }
}

module.exports = new BloodStockRepository(); 
const bloodStockRepository = require('../repositories/bloodStockRepository');

class BloodStockService {
  async getAllStock() {
    return bloodStockRepository.findAll();
  }
}

module.exports = new BloodStockService(); 
const bloodStockService = require('../services/bloodStockService');

class BloodStockController {
  async getAllStock(req, res, next) {
    try {
      const stock = await bloodStockService.getAllStock();
      res.json({ stock });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BloodStockController(); 
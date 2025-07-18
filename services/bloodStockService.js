const bloodStockRepository = require('../repositories/bloodStockRepository');

class BloodStockService {
  async getAllStock() {
    // Compute stock from non-expired donations
    const Donation = require('../models/Donation');
    const now = new Date();
    const donations = await Donation.find({ virusTestResult: 'negative', expirationDate: { $gt: now } });
    // Group by bloodType and city, and track soonest expirationDate
    const stockMap = {};
    // Preload all city docs for fast lookup
    const cityIds = Array.from(new Set(donations.map(d => String(d.city))));
    const City = require('../models/City');
    const cityDocs = await City.find({ _id: { $in: cityIds } });
    const cityMap = {};
    cityDocs.forEach(c => { cityMap[String(c._id)] = c; });
    donations.forEach(d => {
      const key = `${d.bloodType}|${d.city}`;
      if (!stockMap[key]) {
        stockMap[key] = { bloodType: d.bloodType, city: cityMap[String(d.city)], quantity: 0, expirationDate: d.expirationDate };
      }
      stockMap[key].quantity += 1;
      // Track soonest expiration date
      if (d.expirationDate && (!stockMap[key].expirationDate || d.expirationDate < stockMap[key].expirationDate)) {
        stockMap[key].expirationDate = d.expirationDate;
      }
    });
    return Object.values(stockMap);
  }
}

module.exports = new BloodStockService(); 
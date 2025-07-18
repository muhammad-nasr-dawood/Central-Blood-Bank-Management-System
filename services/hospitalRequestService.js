const hospitalRequestRepository = require('../repositories/hospitalRequestRepository');
const bloodStockRepository = require('../repositories/bloodStockRepository');
const City = require('../models/City');
const mongoose = require('mongoose');

// Haversine formula for distance between two city docs
function cityDistance(cityA, cityB) {
  if (!cityA || !cityB) return 9999;
  if (String(cityA._id) === String(cityB._id)) return 0;
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(cityB.latitude - cityA.latitude);
  const dLon = toRad(cityB.longitude - cityA.longitude);
  const lat1 = toRad(cityA.latitude);
  const lat2 = toRad(cityB.latitude);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

class HospitalRequestService {
  async createRequest({ hospitalId, city, bloodType, quantity, patientStatus }) {
    const userRepository = require('../repositories/userRepository');
    const City = require('../models/City');
    let cityDoc = city;
    if (!city) {
      const hospital = await userRepository.findById(hospitalId);
      if (hospital && hospital.city) {
        city = hospital.city;
      } else {
        throw new Error('Hospital city not found');
      }
    }
    // Ensure city is always an ObjectId
    if (typeof city === 'string' || city instanceof String) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        city = mongoose.Types.ObjectId(city);
      } else {
        cityDoc = await City.findOne({ name: city });
        if (!cityDoc) {
          throw new Error('City not found');
        }
        city = cityDoc._id;
      }
    }
    // Always save as unfulfilled initially
    const request = await hospitalRequestRepository.create({
      hospital: hospitalId,
      city,
      bloodType,
      quantity,
      patientStatus,
      fulfilled: false,
    });
    // Check if there are 10+ unfulfilled requests, then process batch
    const unfulfilled = await hospitalRequestRepository.find({ fulfilled: false });
    if (unfulfilled.length >= 10) {
      await this.processBatchRequests(unfulfilled);
    }
    return request;
  }

  // Batch processing: fulfill as many requests as possible, prioritizing by urgency and city distance
  async processBatchRequests(requests) {
    // Prioritize by urgency (Immediate > Urgent > Normal)
    const statusPriority = { 'Immediate': 1, 'Urgent': 2, 'Normal': 3 };
    requests.sort((a, b) => statusPriority[a.patientStatus] - statusPriority[b.patientStatus]);
    // Get all current blood stock
    const stockList = await bloodStockRepository.findAll();
    // Preload all cities for fast lookup
    const allCityIds = new Set();
    requests.forEach(r => allCityIds.add(String(r.city)));
    stockList.forEach(s => allCityIds.add(String(s.city)));
    const cityDocs = await City.find({ _id: { $in: Array.from(allCityIds) } });
    const cityMap = {};
    cityDocs.forEach(c => { cityMap[String(c._id)] = c; });
    for (const req of requests) {
      // Try to find stock in same city first
      let stock = stockList.find(s => s.bloodType === req.bloodType && String(s.city) === String(req.city) && s.quantity >= req.quantity);
      let usedCity = req.city;
      // If not enough, find closest city with enough stock
      if (!stock) {
        let minDist = Infinity;
        for (const s of stockList) {
          if (s.bloodType === req.bloodType && s.quantity >= req.quantity) {
            const dist = cityDistance(cityMap[String(req.city)], cityMap[String(s.city)]);
            if (dist < minDist) {
              minDist = dist;
              stock = s;
              usedCity = s.city;
            }
          }
        }
      }
      if (stock && stock.quantity >= req.quantity) {
        // Withdraw from stock
        await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity - req.quantity });
        // Mark request as fulfilled
        await hospitalRequestRepository.updateById(req._id, { fulfilled: true });
      } else {
        // Not fulfilled
        await hospitalRequestRepository.updateById(req._id, { fulfilled: false });
      }
    }
  }

  // fulfillBatchRequests now just calls processBatchRequests
  async fulfillBatchRequests(requests) {
    return this.processBatchRequests(requests);
  }

  async getAllRequests() {
    return hospitalRequestRepository.findAll();
  }
  async getRequestsByHospital(hospitalId) {
    return hospitalRequestRepository.findByHospital(hospitalId);
  }
}

module.exports = new HospitalRequestService(); 
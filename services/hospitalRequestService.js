const hospitalRequestRepository = require('../repositories/hospitalRequestRepository');
const bloodStockRepository = require('../repositories/bloodStockRepository');

// Realistic city distance matrix for major Egyptian cities (in km, approximate)
const cityDistances = {
  Cairo: { Cairo: 0, Alexandria: 220, Giza: 10, Mansoura: 120, Aswan: 870 },
  Alexandria: { Cairo: 220, Alexandria: 0, Giza: 230, Mansoura: 180, Aswan: 1050 },
  Giza: { Cairo: 10, Alexandria: 230, Giza: 0, Mansoura: 130, Aswan: 880 },
  Mansoura: { Cairo: 120, Alexandria: 180, Giza: 130, Mansoura: 0, Aswan: 990 },
  Aswan: { Cairo: 870, Alexandria: 1050, Giza: 880, Mansoura: 990, Aswan: 0 },
};

function cityDistance(cityA, cityB) {
  if (cityDistances[cityA] && cityDistances[cityA][cityB] !== undefined) {
    return cityDistances[cityA][cityB];
  }
  // Default to a large number if unknown
  return 9999;
}

class HospitalRequestService {
  async createRequest({ hospitalId, city, bloodType, quantity, patientStatus }) {
    // Find matching stock in the same city
    let stock = await bloodStockRepository.findByBloodTypeAndCity(bloodType, city);
    let fulfilled = false;
    if (stock && stock.quantity >= quantity) {
      // Withdraw from stock
      await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity - quantity });
      fulfilled = true;
    }
    // Save request (fulfilled or not)
    const request = await hospitalRequestRepository.create({
      hospital: hospitalId,
      city,
      bloodType,
      quantity,
      patientStatus,
      fulfilled,
    });
    if (!fulfilled) {
      throw new Error('Not enough blood stock available for this request. Request saved as unfulfilled.');
    }
    return request;
  }

  async fulfillBatchRequests(requests) {
    // Sort by patient status priority
    const statusPriority = { 'Immediate': 1, 'Urgent': 2, 'Normal': 3 };
    requests.sort((a, b) => statusPriority[a.patientStatus] - statusPriority[b.patientStatus]);

    // Get all blood stock
    const allStock = await bloodStockRepository.findAll();
    const results = [];
    let fulfilledCount = 0;

    for (const req of requests) {
      // Try to find stock in same city first
      let stock = allStock.find(s => s.bloodType === req.bloodType && s.city === req.city && s.quantity >= req.quantity);
      let usedCity = req.city;
      // If not enough, find closest city with enough stock
      if (!stock) {
        let minDist = Infinity;
        for (const s of allStock) {
          if (s.bloodType === req.bloodType && s.quantity >= req.quantity) {
            const dist = cityDistance(req.city, s.city);
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
        results.push({ requestId: req._id, fulfilled: true, usedCity });
        fulfilledCount++;
      } else {
        // Not fulfilled
        await hospitalRequestRepository.updateById(req._id, { fulfilled: false });
        results.push({ requestId: req._id, fulfilled: false });
      }
      if (fulfilledCount >= 10) break;
    }
    return results;
  }

  async getAllRequests() {
    return hospitalRequestRepository.findAll();
  }
  async getRequestsByHospital(hospitalId) {
    return hospitalRequestRepository.findByHospital(hospitalId);
  }
}

module.exports = new HospitalRequestService(); 
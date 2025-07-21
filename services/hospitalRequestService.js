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

  // --- Genetic Algorithm Helpers ---
  // Chromosome: Array of assignments (stock index or -1 for unfulfilled)
  _encodeChromosome(requests, stockList) {
    // For each request, randomly assign a valid stock index or -1 (unfulfilled)
    const chromosome = [];
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      // Find all stocks that match blood type and have enough quantity
      const validStocks = stockList
        .map((s, idx) => ({ s, idx }))
        .filter(({ s }) => s.bloodType === req.bloodType && s.quantity >= req.quantity);
      if (validStocks.length === 0) {
        chromosome.push(-1); // unfulfilled
      } else {
        // Randomly pick a valid stock or leave unfulfilled (small chance)
        if (Math.random() < 0.1) {
          chromosome.push(-1);
        } else {
          const pick = validStocks[Math.floor(Math.random() * validStocks.length)];
          chromosome.push(pick.idx);
        }
      }
    }
    return chromosome;
  }

  _fitness(chromosome, requests, stockList, cityMap, statusPriority) {
    // Fitness: higher for more fulfilled, urgent, and closer requests
    let score = 0;
    // Track stock usage to avoid over-assigning
    const stockUsage = Array(stockList.length).fill(0);
    for (let i = 0; i < chromosome.length; i++) {
      const stockIdx = chromosome[i];
      const req = requests[i];
      if (stockIdx === -1) {
        // Penalize unfulfilled, more for urgent
        score -= 10 * (4 - statusPriority[req.patientStatus]);
        continue;
      }
      const stock = stockList[stockIdx];
      // Check if stock is valid
      if (stock.bloodType !== req.bloodType) {
        score -= 20; // heavy penalty for invalid assignment
        continue;
      }
      stockUsage[stockIdx] += req.quantity;
      // Reward fulfillment, more for urgent
      score += 20 * (4 - statusPriority[req.patientStatus]);
      // Penalize distance
      const dist = cityDistance(cityMap[String(req.city)], cityMap[String(stock.city)]);
      score -= dist;
    }
    // Penalize over-used stocks
    for (let i = 0; i < stockList.length; i++) {
      if (stockUsage[i] > stockList[i].quantity) {
        score -= 50 * (stockUsage[i] - stockList[i].quantity);
      }
    }
    return score;
  }

  _selectParents(population, fitnesses) {
    // Tournament selection: pick 3 random, return best two
    function pickOne() {
      const idxs = [];
      while (idxs.length < 3) {
        const idx = Math.floor(Math.random() * population.length);
        if (!idxs.includes(idx)) idxs.push(idx);
      }
      let bestIdx = idxs[0];
      for (const idx of idxs) {
        if (fitnesses[idx] > fitnesses[bestIdx]) bestIdx = idx;
      }
      return population[bestIdx];
    }
    return [pickOne(), pickOne()]; // returns the best two chromosomes from the population to be used as parents for the next generation
  }

  _crossover(parentA, parentB) {
    // Single-point crossover
    const len = parentA.length;
    const point = Math.floor(Math.random() * len);
    return parentA.slice(0, point).concat(parentB.slice(point));
  }

  _mutate(chromosome, stockList, requests) {
    // Randomly reassign one gene (request) to a valid stock or -1
    const idx = Math.floor(Math.random() * chromosome.length);
    const req = requests[idx];
    // Find all valid stocks for this request
    const validStocks = stockList
      .map((s, sIdx) => ({ s, sIdx }))
      .filter(({ s }) => s.bloodType === req.bloodType && s.quantity >= req.quantity);
    // 20% chance to mutate to -1 (unfulfilled), otherwise pick a valid stock if available
    if (validStocks.length === 0 || Math.random() < 0.2) {
      chromosome[idx] = -1;
    } else {
      const pick = validStocks[Math.floor(Math.random() * validStocks.length)];
      chromosome[idx] = pick.sIdx;
    }
    return chromosome;
  }

  // --- Genetic Algorithm Batch Processing ---
  async processBatchRequests(requests) {
    // Prepare data
    console.log('[HospitalRequestService] Processing batch requests:', requests.length);
    const statusPriority = { 'Immediate': 1, 'Urgent': 2, 'Normal': 3 };
    const stockList = await bloodStockRepository.findAll();
    const allCityIds = new Set();
    requests.forEach(r => allCityIds.add(String(r.city)));
    stockList.forEach(s => allCityIds.add(String(s.city)));
    const cityDocs = await City.find({ _id: { $in: Array.from(allCityIds) } });
    const cityMap = {};
    cityDocs.forEach(c => { cityMap[String(c._id)] = c; });

    // Genetic Algorithm parameters
    const POP_SIZE = 30;
    const GENERATIONS = 40;
    const MUTATION_RATE = 0.1;

    // 1. Initialize population
    let population = []; // so the population here has a list of chromosomes, each chromosome is an array of stock indices (or -1 for unfulfilled) and each index in the chromosome represents a request that is being fulfilled by that stock index
    for (let i = 0; i < POP_SIZE; i++) {
      population.push(this._encodeChromosome(requests, stockList)); // after encoding the requests to chromosomes each request represtent an index in the chromosome (which is in the end an index in the stocklist)  it could be -1 for unfulfilled or couldn't pick a stock
    }

    // 2. Evolution loop
    for (let gen = 0; gen < GENERATIONS; gen++) {
      // a. Evaluate fitness
      const fitnesses = population.map(chrom => this._fitness(chrom, requests, stockList, cityMap, statusPriority)); // it returns an array of fitness scores for each chromosome(request)

      // b. Create new population
      let newPopulation = [];
      while (newPopulation.length < POP_SIZE) {
        // c. Select parents
        const [parentA, parentB] = this._selectParents(population, fitnesses); // select best two chromosomes from the population to be used as parents for the next generation
        // d. Crossover
        let child = this._crossover(parentA, parentB); // this is the new chromosome (child) created by combining the two parents
        // e. Mutation
        if (Math.random() < MUTATION_RATE) {
          child = this._mutate(child, stockList, requests); 
        }
        newPopulation.push(child);
      }
      population = newPopulation;
    }

    // 3. Pick best chromosome from the last generation
    const fitnesses = population.map(chrom => this._fitness(chrom, requests, stockList, cityMap, statusPriority));
    const bestIdx = fitnesses.indexOf(Math.max(...fitnesses));
    const bestChromosome = population[bestIdx];

    // 4. Apply assignments (update DB)
    // We'll use a local copy of stock quantities to avoid over-withdrawal
    const localStock = stockList.map(s => ({ ...s, quantity: s.quantity, bloodType: s.bloodType, city: s.city, _id: s._id }));
    console.log('[HospitalRequestService] Best chromosome:', bestChromosome);
    for (let i = 0; i < bestChromosome.length; i++) {
      const stockIdx = bestChromosome[i];
      const req = requests[i];
      if (stockIdx === -1) {
        // Mark as unfulfilled
        await hospitalRequestRepository.updateById(req._id, { fulfilled: false });
        continue;
      }
      const stock = localStock[stockIdx];
      // Check if enough stock remains
      
      const reqCity = cityMap[String(req.city)];
      const stockCity = cityMap[String(stock.city)];
      console.log(`[HospitalRequestService] Fulfilling request of quantity ${req.quantity} of type ${req.bloodType} of city ${reqCity ? reqCity.name : req.city}, with stock of quantity ${stock.quantity} of type ${stock.bloodType} of city ${stockCity ? stockCity.name : stock.city}, stockId ${stock._id}`);


      if (stock.bloodType === req.bloodType && stock.quantity >= req.quantity) {
        // Withdraw from stock
        stock.quantity -= req.quantity;
        await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity });
        await hospitalRequestRepository.updateById(req._id, { fulfilled: true });
      } else {
        // Not enough stock or invalid, mark as unfulfilled
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
    const HospitalRequest = require('../models/HospitalRequest');
    return HospitalRequest.find({ hospital: hospitalId }).populate('city');
  }
}

module.exports = new HospitalRequestService(); 
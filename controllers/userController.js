const userService = require('../services/userService');

class UserController {
  async registerDonor(req, res, next) {
    try {
      const donor = await userService.registerDonor(req.body);
      res.status(201).json({ message: 'Donor registered successfully', donor });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await userService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addHospital(req, res, next) {
    try {
      const hospital = await userService.addHospital(req.body);
      res.status(201).json({ message: 'Hospital added successfully', hospital });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const result = await userService.verifyEmail(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async adminAddDonation(req, res, next) {
    try {
      const { donorEmail, date, bloodType, virusTestResult, city, expirationDate } = req.body;
      const userRepository = require('../repositories/userRepository');
      const donationService = require('../services/donationService');
      const donor = await userRepository.findByEmail(donorEmail);
      if (!donor || donor.role !== 'donor') {
        return res.status(404).json({ message: 'Donor not found' });
      }
      const donation = await donationService.createDonation({
        donorId: donor._id,
        date,
        bloodType,
        virusTestResult: virusTestResult || 'pending',
        city,
        expirationDate
      });
      res.status(201).json({ message: 'Donation added successfully', donation });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController(); 
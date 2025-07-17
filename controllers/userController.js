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
}

module.exports = new UserController(); 
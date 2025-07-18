const donationService = require('../services/donationService');

class DonationController {
  async createDonation(req, res, next) {
    try {
      const donorId = req.user.id;
      const { date, bloodType, virusTestResult, city, expirationDate } = req.body;
      const donation = await donationService.createDonation({ donorId, date, bloodType, virusTestResult, city, expirationDate });
      res.status(201).json({ message: 'Donation accepted and added to stock', donation });
    } catch (err) {
      next(err);
    }
  }

  async getMyDonations(req, res, next) {
    try {
      const donorId = req.user.id;
      const donations = await donationService.getDonationsByDonor(donorId);
      res.json({ donations });
    } catch (err) {
      next(err);
    }
  }

  async adminUpdateVirusStatus(req, res, next) {
    try {
      const { donationId } = req.params;
      const { virusTestResult } = req.body;
      const updated = await donationService.updateDonationVirusStatus(donationId, virusTestResult);
      res.json({ message: 'Virus test result updated', donation: updated });
    } catch (err) {
      next(err);
    }
  }

  async adminGetAllDonations(req, res, next) {
    try {
      const donationRepository = require('../repositories/donationRepository');
      const donations = await donationRepository.findAllWithDonor();
      res.json({ donations });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DonationController(); 
const donationRepository = require('../repositories/donationRepository');
const userRepository = require('../repositories/userRepository');
const bloodStockRepository = require('../repositories/bloodStockRepository');
const nodemailer = require('nodemailer');
require('dotenv').config();

class DonationService {
  async createDonation({ donorId, date, bloodType, virusTestResult, city, expirationDate }) {
    // Check last donation date
    const donations = await donationRepository.findByDonor(donorId);
    const lastDonation = donations.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const donor = await userRepository.findById(donorId);
    if (lastDonation) {
      const diffMonths = (new Date(date) - new Date(lastDonation.date)) / (1000 * 60 * 60 * 24 * 30);
      if (diffMonths < 3) {
        await this.notifyDonor(donor.email, 'Donation rejected: Less than 3 months since last donation.');
        throw new Error('Donation rejected: Less than 3 months since last donation.');
      }
    }
    // Check virus test
    if (virusTestResult === 'positive') {
      await this.notifyDonor(donor.email, 'Donation rejected: Blood virus test is positive.');
      throw new Error('Donation rejected: Blood virus test is positive.');
    }
    // Always use a standard expiration date (e.g., 42 days from donation date)
    const donationDate = date ? new Date(date) : new Date();
    const standardExpiration = new Date(donationDate);
    standardExpiration.setDate(standardExpiration.getDate() + 42);
    const finalExpiration = standardExpiration.toISOString();
    // Create donation
    const donation = await donationRepository.create({ donor: donorId, date: donationDate, bloodType, virusTestResult, city, expirationDate: finalExpiration });
    // Only update blood stock if virusTestResult is 'negative'
    if (virusTestResult === 'negative') {
      let stock = await bloodStockRepository.findByBloodTypeAndCity(bloodType, city);
      if (stock) {
        stock = await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity + 1 });
      } else {
        stock = await bloodStockRepository.create({ bloodType, city, quantity: 1 });
      }
    }
    return donation;
  }

  async updateDonationVirusStatus(donationId, virusTestResult) {
    // Only allow valid values
    if (!['negative', 'positive', 'pending'].includes(virusTestResult)) {
      throw new Error('Invalid virus test result');
    }
    // Get the current donation
    const donation = await donationRepository.findById(donationId);
    if (!donation) throw new Error('Donation not found');
    const prevStatus = donation.virusTestResult;
    // Update the virus status
    const updated = await donationRepository.updateById(donationId, { virusTestResult });
    // If status changed to negative and was not negative before, add to stock
    if (virusTestResult === 'negative' && prevStatus !== 'negative') {
      let stock = await bloodStockRepository.findByBloodTypeAndCity(donation.bloodType, donation.city);
      if (stock) {
        stock = await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity + 1 });
      } else {
        stock = await bloodStockRepository.create({ bloodType: donation.bloodType, city: donation.city, quantity: 1 });
      }
    }
    return updated;
  }

  async notifyDonor(email, reason) {
    // Configure your email service here
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Blood Donation Rejection',
      text: reason,
    });
  }

  async getDonationsByDonor(donorId) {
    return donationRepository.findByDonor(donorId);
  }

  async getAllDonations() {
    const donationRepository = require('../repositories/donationRepository');
    // Populate both donor and city
    return donationRepository.findAllWithDonorAndCity();
  }
}

module.exports = new DonationService(); 
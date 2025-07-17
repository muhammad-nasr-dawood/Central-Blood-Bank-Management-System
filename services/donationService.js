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
    if (virusTestResult !== 'negative') {
      await this.notifyDonor(donor.email, 'Donation rejected: Blood virus test is positive.');
      throw new Error('Donation rejected: Blood virus test is positive.');
    }
    // Create donation
    const donation = await donationRepository.create({ donor: donorId, date, bloodType, virusTestResult, city, expirationDate });
    // Update blood stock
    let stock = await bloodStockRepository.findByBloodTypeAndCity(bloodType, city);
    if (stock) {
      stock = await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity + 1 });
    } else {
      stock = await bloodStockRepository.create({ bloodType, city, expirationDate, quantity: 1 });
    }
    return donation;
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
}

module.exports = new DonationService(); 
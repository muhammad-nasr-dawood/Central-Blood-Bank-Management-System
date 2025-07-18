const Donation = require('../models/Donation');

class DonationRepository {
  async create(donationData) {
    return Donation.create(donationData);
  }
  async findByDonor(donorId) {
    return Donation.find({ donor: donorId });
  }
  async findByBloodType(bloodType) {
    return Donation.find({ bloodType });
  }
  async findByCity(city) {
    return Donation.find({ city });
  }
  async findById(id) {
    return Donation.findById(id);
  }
  async updateById(id, update) {
    return Donation.findByIdAndUpdate(id, update, { new: true });
  }
  async deleteById(id) {
    return Donation.findByIdAndDelete(id);
  }
  async findAllWithDonor() {
    return Donation.find().populate('donor', 'name nationalId city');
  }
  async findAllWithDonorAndCity() {
    return Donation.find().populate('donor', 'name nationalId city').populate('city');
  }
}

module.exports = new DonationRepository(); 
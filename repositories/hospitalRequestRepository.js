const HospitalRequest = require('../models/HospitalRequest');

class HospitalRequestRepository {
  async create(requestData) {
    return HospitalRequest.create(requestData);
  }
  async findByHospital(hospitalId) {
    return HospitalRequest.find({ hospital: hospitalId });
  }
  async findByBloodType(bloodType) {
    return HospitalRequest.find({ bloodType });
  }
  async findByCity(city) {
    return HospitalRequest.find({ city });
  }
  async findByPatientStatus(status) {
    return HospitalRequest.find({ patientStatus: status });
  }
  async findById(id) {
    return HospitalRequest.findById(id);
  }
  async updateById(id, update) {
    return HospitalRequest.findByIdAndUpdate(id, update, { new: true });
  }
  async deleteById(id) {
    return HospitalRequest.findByIdAndDelete(id);
  }
  async findAll() {
    return HospitalRequest.find();
  }
}

module.exports = new HospitalRequestRepository(); 
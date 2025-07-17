const hospitalRequestService = require('../services/hospitalRequestService');
const hospitalRequestRepository = require('../repositories/hospitalRequestRepository');

class HospitalRequestController {
  async createRequest(req, res, next) {
    try {
      const hospitalId = req.user.id;
      const { city, bloodType, quantity, patientStatus } = req.body;
      const request = await hospitalRequestService.createRequest({ hospitalId, city, bloodType, quantity, patientStatus });
      res.status(201).json({ message: 'Request fulfilled', request });
    } catch (err) {
      next(err);
    }
  }

  async fulfillBatchRequests(req, res, next) {
    try {
      const { requestIds } = req.body;
      const requests = await Promise.all(requestIds.map(id => hospitalRequestRepository.findById(id)));
      const results = await hospitalRequestService.fulfillBatchRequests(requests.filter(Boolean));
      res.json({ results });
    } catch (err) {
      next(err);
    }
  }

  async getAllRequests(req, res, next) {
    try {
      const requests = await hospitalRequestService.getAllRequests();
      res.json({ requests });
    } catch (err) {
      next(err);
    }
  }
  async getRequestsByHospital(req, res, next) {
    try {
      const hospitalId = req.user.id;
      const requests = await hospitalRequestService.getRequestsByHospital(hospitalId);
      res.json({ requests });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HospitalRequestController(); 
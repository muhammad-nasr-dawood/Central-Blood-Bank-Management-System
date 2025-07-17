const User = require('../models/User');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }
  async findByEmail(email) {
    return User.findOne({ email });
  }
  async findById(id) {
    return User.findById(id);
  }
  async findByRole(role) {
    return User.find({ role });
  }
  async updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true });
  }
  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository(); 
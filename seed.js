const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const City = require('./models/City');

const Branch = require('./models/Branch');
require('dotenv').config();

const hospitals = [
  { name: 'Cairo Hospital', email: 'cairo@hospital.com', city: 'Cairo', password: 'hospital123' },
  { name: 'Alexandria Hospital', email: 'alex@hospital.com', city: 'Alexandria', password: 'hospital123' },
  { name: 'Giza Hospital', email: 'giza@hospital.com', city: 'Giza', password: 'hospital123' },
  { name: 'Mansoura Hospital', email: 'mansoura@hospital.com', city: 'Mansoura', password: 'hospital123' },
  { name: 'Aswan Hospital', email: 'aswan@hospital.com', city: 'Aswan', password: 'hospital123' },
];

const admin = { name: 'Admin', email: 'admin@bloodbank.com', password: 'admin123', role: 'admin' };

// Example coordinates for each city
const cityData = {
  Cairo: { latitude: 30.0444, longitude: 31.2357 },
  Alexandria: { latitude: 31.2001, longitude: 29.9187 },
  Giza: { latitude: 30.0131, longitude: 31.2089 },
  Mansoura: { latitude: 31.0364, longitude: 31.3807 },
  Aswan: { latitude: 24.0889, longitude: 32.8998 }
};

// Example branches
const branches = [
  { name: 'Cairo Main Branch', city: 'Cairo' },
  { name: 'Alexandria Central Branch', city: 'Alexandria' },
  { name: 'Giza Branch', city: 'Giza' },
  { name: 'Mansoura Branch', city: 'Mansoura' },
  { name: 'Aswan Branch', city: 'Aswan' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
  // Create admin
  const hashedAdmin = await bcrypt.hash(admin.password, 10);
  await User.create({ ...admin, password: hashedAdmin });
  // Create hospitals (in User collection for login)
  for (const h of hospitals) {
    // Find or create city
    let cityDoc = await City.findOne({ name: h.city });
    if (!cityDoc) {
      const coords = cityData[h.city] || { latitude: 0, longitude: 0 };
      cityDoc = await City.create({ name: h.city, latitude: coords.latitude, longitude: coords.longitude });
    }
    const hashed = await bcrypt.hash(h.password, 10);
    await User.create({ name: h.name, email: h.email, password: hashed, city: cityDoc._id, role: 'hospital', verified: true });
  }
  // Create branches
  for (const b of branches) {
    let cityDoc = await City.findOne({ name: b.city });
    if (!cityDoc) {
      const coords = cityData[b.city] || { latitude: 0, longitude: 0 };
      cityDoc = await City.create({ name: b.city, latitude: coords.latitude, longitude: coords.longitude });
    }
    await Branch.create({ name: b.name, city: cityDoc._id });
  }
  console.log('Seeding done!');
  process.exit();
}

seed(); 
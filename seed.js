const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const City = require('./models/City');
const Branch = require('./models/Branch');
const BloodStock = require('./models/BloodStock');
const HospitalRequest = require('./models/HospitalRequest');
const Donation = require('./models/Donation');
require('dotenv').config();

const bloodTypes = ['A', 'B', 'AB', 'O'];
const patientStatuses = ['Immediate', 'Urgent', 'Normal'];

const cityData = [
  { name: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
  { name: 'Alexandria', latitude: 31.2001, longitude: 29.9187 },
  { name: 'Giza', latitude: 30.0131, longitude: 31.2089 },
  { name: 'Mansoura', latitude: 31.0364, longitude: 31.3807 },
  { name: 'Aswan', latitude: 24.0889, longitude: 32.8998 }
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
  await City.deleteMany({});
  await Branch.deleteMany({});
  await BloodStock.deleteMany({});
  await HospitalRequest.deleteMany({});
  await Donation.deleteMany({});

  // 1. Seed Cities
  const cityDocs = [];
  for (const c of cityData) {
    cityDocs.push(await City.create(c));
  }

  // 2. Seed Hospitals (Users with role 'hospital')
  const hospitals = [];
  for (let i = 0; i < 5; i++) {
    const city = randomFrom(cityDocs);
    const hospital = await User.create({
      name: `Hospital ${city.name}`,
      email: `hospital${i}@test.com`,
      password: await bcrypt.hash('hospital123', 10),
      city: city._id,
      role: 'hospital',
      verified: true
    });
    hospitals.push(hospital);
  }

  // 2.1. Seed Admin User
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@bloodbank.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    verified: true
  });

  // 3. Seed Donors (Users with role 'donor')
  const donors = [];
  for (let i = 0; i < 10; i++) {
    const city = randomFrom(cityDocs);
    const donor = await User.create({
      name: `Donor ${i}`,
      email: `donor${i}@test.com`,
      password: await bcrypt.hash('donor123', 10),
      city: city._id,
      role: 'donor',
      verified: true,
      nationalId: `234222${100000 + i}` // Add unique nationalId
    });
    donors.push(donor);
  }

  // 4. Seed Branches
  const branches = [];
  for (let i = 0; i < 10; i++) {
    const city = randomFrom(cityDocs);
    const branch = await Branch.create({
      name: `Branch ${i} - ${city.name}`,
      city: city._id
    });
    branches.push(branch);
  }

  // 5. Seed BloodStock
  const bloodStocks = [];
  for (let i = 0; i < 20; i++) {
    const city = randomFrom(cityDocs);
    const bloodType = randomFrom(bloodTypes);
    const quantity = Math.floor(Math.random() * 20) + 5; // 5-24 units
    const stock = await BloodStock.create({
      city: city._id,
      bloodType,
      quantity
    });
    bloodStocks.push(stock);
  }

  // 6. Seed HospitalRequests
  for (let i = 0; i < 20; i++) {
    const hospital = randomFrom(hospitals);
    const city = hospital.city;
    const bloodType = randomFrom(bloodTypes);
    const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 units
    const patientStatus = randomFrom(patientStatuses);
    await HospitalRequest.create({
      hospital: hospital._id,
      city,
      bloodType,
      quantity,
      patientStatus,
      fulfilled: false
    });
  }

  // 7. Seed Donations
  for (let i = 0; i < 200; i++) {
    const donor = randomFrom(donors);
    const branch = randomFrom(branches);
    const bloodType = randomFrom(bloodTypes);
    const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // up to 30 days ago
    const virusTestResult = 'negative';
    const city = donor.city;
    const expirationDate = new Date(date.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days after donation
    await Donation.create({
      donor: donor._id,
      date,
      bloodType,
      virusTestResult,
      city,
      expirationDate,
      expired: false
    });
  }

  console.log('Seeding done!');
  process.exit();
}

seed(); 
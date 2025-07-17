const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const hospitals = [
  { name: 'Cairo Hospital', email: 'cairo@hospital.com', city: 'Cairo', password: 'hospital123' },
  { name: 'Alexandria Hospital', email: 'alex@hospital.com', city: 'Alexandria', password: 'hospital123' },
  { name: 'Giza Hospital', email: 'giza@hospital.com', city: 'Giza', password: 'hospital123' },
  { name: 'Mansoura Hospital', email: 'mansoura@hospital.com', city: 'Mansoura', password: 'hospital123' },
  { name: 'Aswan Hospital', email: 'aswan@hospital.com', city: 'Aswan', password: 'hospital123' },
];

const admin = { name: 'Admin', email: 'admin@bloodbank.com', password: 'admin123', role: 'admin' };

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
  // Create admin
  const hashedAdmin = await bcrypt.hash(admin.password, 10);
  await User.create({ ...admin, password: hashedAdmin });
  // Create hospitals
  for (const h of hospitals) {
    const hashed = await bcrypt.hash(h.password, 10);
    await User.create({ name: h.name, email: h.email, password: hashed, city: h.city, role: 'hospital' });
  }
  console.log('Seeding done!');
  process.exit();
}

seed(); 
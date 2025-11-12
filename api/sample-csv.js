const { BlobServiceClient } = require('@azure/storage-blob');
const sql = require('mssql');

// Sample CSV data generator
function generateSampleCsvData() {
  const data = [];
  const names = ['Max Mustermann', 'Anna Schmidt', 'Peter Müller', 'Lisa Weber', 'Thomas Fischer'];
  const cities = ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt'];
  
  for (let i = 1; i <= 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    data.push({
      id: i,
      name: `${name} ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 40) + 20,
      city: city,
      salary: Math.floor(Math.random() * 50000) + 30000
    });
  }
  
  return data;
}

module.exports = async (req, res) => {
  try {
    const data = generateSampleCsvData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error generating sample CSV data:', error);
    res.status(500).json({ error: 'Failed to generate sample data' });
  }
};



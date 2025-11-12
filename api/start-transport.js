const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

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

function convertToCsv(data) {
  const headers = ['id', 'name', 'email', 'age', 'city', 'salary'];
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

module.exports = async (req, res) => {
  try {
    // Support both connection string and account name/key authentication
    let blobServiceClient;
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
    } else if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY) {
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
      const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      throw new Error('Azure Storage credentials not configured');
    }
    
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'csv-uploads';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists with public blob access
    await containerClient.createIfNotExists({
      access: 'blob' // Allows anonymous read access to blobs
    });
    
    // Generate CSV data
    const csvData = generateSampleCsvData();
    const csvContent = convertToCsv(csvData);
    
    // Upload to blob storage
    const fileName = `transport-${uuidv4()}.csv`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    await blockBlobClient.upload(csvContent, csvContent.length, {
      blobHTTPHeaders: { blobContentType: 'text/csv' }
    });
    
    res.status(200).json({
      message: 'CSV file uploaded to Azure Blob Storage',
      fileId: fileName,
      blobUrl: blockBlobClient.url
    });
  } catch (error) {
    console.error('Error starting transport:', error);
    
    // Provide more detailed error information
    let errorMessage = error.message || 'Unknown error';
    let errorDetails = '';
    
    if (error.message && error.message.includes('Azure Storage credentials')) {
      errorMessage = 'Azure Storage configuration incomplete';
      errorDetails = 'Missing AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY in Vercel environment variables';
    } else if (error.message && error.message.includes('container')) {
      errorDetails = 'Error accessing or creating storage container';
    }
    
    res.status(500).json({ 
      error: 'Failed to start transport', 
      details: errorDetails || errorMessage,
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


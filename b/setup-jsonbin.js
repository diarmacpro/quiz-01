// Script to upload sample data to jsonbin.io
// Run this script using Node.js to initialize your jsonbin with sample data

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration (same as in the app)
const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b/683922298561e97a501d56f6';
const JSONBIN_MASTER_KEY = '$2a$10$kxZTFqM7lWIWuqby/NOPo.3AWCvRp94VtcrCkVanjlQkN3vcS0L2S';

async function uploadSampleData() {
  try {
    // Read the sample data file
    const sampleDataPath = path.join(__dirname, 'sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    // Add a timestamp to the version to force an update
    sampleData.siteInfo.version = `1.0.0-${Date.now()}`;
    
    // Upload to jsonbin.io
    const response = await fetch(JSONBIN_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(sampleData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Sample data uploaded successfully!');
    console.log('Response:', result);
  } catch (error) {
    console.error('Error uploading sample data:', error);
  }
}

// Run the upload function
uploadSampleData();
const crypto = require('crypto');
const axios = require('axios');

/**
 * Configuration for the EnergyGrid API
 */
const CONFIG = {
  API_URL: 'http://localhost:3000/device/real/query',
  TOKEN: 'interview_token_123',
  RATE_LIMIT_MS: 1000,  // 1 request per second
  BATCH_SIZE: 10,       // Max 10 devices per request
  MAX_RETRIES: 3,       // Max retry attempts for failed requests
  RETRY_DELAY_MS: 2000  // Delay before retrying
};

/**
 * Generate MD5 signature for API authentication
 * Formula: MD5(URL + Token + Timestamp)
 */
function generateSignature(url, token, timestamp) {
  const data = url + token + timestamp;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Generate a list of dummy serial numbers
 */
function generateSerialNumbers(count) {
  const serialNumbers = [];
  for (let i = 0; i < count; i++) {
    serialNumbers.push(`SN-${String(i).padStart(3, '0')}`);
  }
  return serialNumbers;
}

/**
 * Split array into batches of specified size
 */
function createBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Make a single API request with proper signature
 */
async function makeRequest(snList, retryCount = 0) {
  const timestamp = Date.now().toString();
  const url = new URL(CONFIG.API_URL).pathname;
  const signature = generateSignature(url, CONFIG.TOKEN, timestamp);

  try {
    const response = await axios.post(
      CONFIG.API_URL,
      { sn_list: snList },
      {
        headers: {
          'signature': signature,
          'timestamp': timestamp,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    // Handle 429 (Rate Limit) or network errors with retry logic
    if (error.response?.status === 429 || error.code === 'ECONNREFUSED') {
      if (retryCount < CONFIG.MAX_RETRIES) {
        console.log(`⚠️  Request failed (${error.response?.status || error.code}). Retrying in ${CONFIG.RETRY_DELAY_MS}ms... (Attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
        await sleep(CONFIG.RETRY_DELAY_MS);
        return makeRequest(snList, retryCount + 1);
      } else {
        throw new Error(`Failed after ${CONFIG.MAX_RETRIES} retries: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate-limited request queue processor
 * Ensures exactly 1 request per second
 */
class RateLimitedQueue {
  constructor(rateLimitMs) {
    this.rateLimitMs = rateLimitMs;
    this.lastRequestTime = 0;
  }

  async execute(fn) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - timeSinceLastRequest;
      await sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
    return await fn();
  }
}

/**
 * Main function to fetch data from all devices
 */
async function fetchAllDeviceData() {
  console.log('🚀 EnergyGrid Data Aggregator');
  console.log('=' .repeat(50));
  
  // Step 1: Generate serial numbers
  const serialNumbers = generateSerialNumbers(500);
  console.log(`✓ Generated ${serialNumbers.length} serial numbers (${serialNumbers[0]} to ${serialNumbers[serialNumbers.length - 1]})`);
  
  // Step 2: Create batches
  const batches = createBatches(serialNumbers, CONFIG.BATCH_SIZE);
  console.log(`✓ Created ${batches.length} batches (${CONFIG.BATCH_SIZE} devices per batch)`);
  console.log(`⏱️  Estimated time: ~${batches.length} seconds (1 req/sec rate limit)`);
  console.log('=' .repeat(50));
  
  // Step 3: Fetch data with rate limiting
  const queue = new RateLimitedQueue(CONFIG.RATE_LIMIT_MS);
  const allResults = [];
  let successCount = 0;
  let failureCount = 0;
  
  const startTime = Date.now();
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNumber = i + 1;
    
    try {
      const result = await queue.execute(() => makeRequest(batch));
      allResults.push(...result.data);
      successCount += batch.length;
      
      // Progress indicator
      const progress = ((batchNumber / batches.length) * 100).toFixed(1);
      console.log(`[${batchNumber}/${batches.length}] ✓ Batch ${batchNumber} complete (${batch.length} devices) - Progress: ${progress}%`);
    } catch (error) {
      failureCount += batch.length;
      console.error(`[${batchNumber}/${batches.length}] ✗ Batch ${batchNumber} failed:`, error.message);
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Step 4: Aggregate and display results
  console.log('=' .repeat(50));
  console.log('📊 RESULTS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Devices Requested: ${serialNumbers.length}`);
  console.log(`Successfully Retrieved: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Total Execution Time: ${duration}s`);
  console.log(`Batches Processed: ${batches.length}`);
  console.log('=' .repeat(50));
  
  // Step 5: Show sample data
  console.log('\n📋 Sample Data (first 5 devices):');
  allResults.slice(0, 5).forEach((device, idx) => {
    console.log(`  ${idx + 1}. SN: ${device.sn} | Power: ${device.power} | Status: ${device.status}`);
  });
  
  // Step 6: Calculate statistics
  const onlineDevices = allResults.filter(d => d.status === 'Online').length;
  const offlineDevices = allResults.filter(d => d.status === 'Offline').length;
  
  console.log('\n📈 Device Statistics:');
  console.log(`  Online: ${onlineDevices} (${((onlineDevices/allResults.length) * 100).toFixed(1)}%)`);
  console.log(`  Offline: ${offlineDevices} (${((offlineDevices/allResults.length) * 100).toFixed(1)}%)`);
  
  return {
    totalDevices: serialNumbers.length,
    successCount,
    failureCount,
    duration,
    data: allResults,
    statistics: {
      online: onlineDevices,
      offline: offlineDevices
    }
  };
}

// Run the application
if (require.main === module) {
  fetchAllDeviceData()
    .then(() => {
      console.log('\n✅ Data aggregation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAllDeviceData, generateSignature };

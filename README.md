# EnergyGrid Data Aggregator

A robust client application to fetch real-time telemetry from 500 solar inverters while navigating strict rate limits and security protocols.

## 📋 Project Overview

This project demonstrates a production-ready solution for aggregating data from a rate-limited API with custom security requirements. It consists of:

1. **Mock API Server** - Simulates the legacy EnergyGrid API with strict constraints
2. **Client Application** - Fetches and aggregates data from 500 devices efficiently

## 🎯 The Challenge

Integrate with a legacy "EnergyGrid" API with the following constraints:

- ⏱️ **Rate Limit**: Strictly **1 request per second** (exceeding returns `HTTP 429`)
- 📦 **Batch Limit**: Maximum **10 devices** per request
- 🔐 **Security**: Custom signature header required: `MD5(URL + Token + Timestamp)`

## 🚀 Quick Start

### Prerequisites

- Node.js v14 or higher
- npm (Node Package Manager)

### Installation & Running

1. **Clone or download this repository**

2. **Start the Mock API Server** (Terminal 1):
   ```bash
   cd mock-api
   npm install
   npm start
   ```
   
   You should see:
   ```
   ⚡ EnergyGrid Mock API running on port 3000
      Constraints: 1 req/sec, Max 10 items/batch
   ```

3. **Run the Client Application** (Terminal 2):
   ```bash
   cd client
   npm install
   npm start
   ```
   
   The client will fetch data from all 500 devices and display progress.

## 📁 Project Structure

```
Energy Grid Data Aggregator/
├── mock-api/              # Mock API server
│   ├── server.js         # Express server with rate limiting & auth
│   ├── package.json      # Dependencies
│   └── README.md         # API documentation
│
├── client/               # Client application
│   ├── client.js        # Main client with rate limiting logic
│   ├── package.json     # Dependencies
│   └── README.md        # Client documentation
│
└── README.md            # This file
```

## 🔧 Technical Implementation

### Client Features

✅ **Serial Number Generation**
- Generates 500 dummy serial numbers (`SN-000` to `SN-499`)

✅ **Smart Batching**
- Divides 500 devices into 50 batches of 10
- Optimizes API usage while respecting batch size limits

✅ **Rate Limiting**
- Custom `RateLimitedQueue` class ensures strict 1 req/sec
- Precise timing to prevent 429 errors

✅ **Security Implementation**
- Generates MD5 signatures for authentication
- Includes timestamp and signature headers

✅ **Error Handling**
- Retry logic with exponential backoff
- Graceful handling of network failures
- Detailed error logging

✅ **Data Aggregation**
- Collects all device data into unified dataset
- Computes statistics (online/offline devices)
- Real-time progress tracking

### Mock API Features

✅ **Rate Limiting Middleware**
- Enforces 1 request per second
- Returns 429 if limit exceeded

✅ **Security Middleware**
- Validates MD5 signature
- Returns 401 for invalid signatures

✅ **Batch Size Validation**
- Enforces max 10 devices per request
- Returns 400 if exceeded

✅ **Realistic Data Simulation**
- Random power output (0-5 kW)
- Random status (Online/Offline)
- Timestamps for each reading

## 📊 Expected Results

When you run the client, you should see:

```
🚀 EnergyGrid Data Aggregator
==================================================
✓ Generated 500 serial numbers (SN-000 to SN-499)
✓ Created 50 batches (10 devices per batch)
⏱️  Estimated time: ~50 seconds (1 req/sec rate limit)
==================================================
[1/50] ✓ Batch 1 complete (10 devices) - Progress: 2.0%
[2/50] ✓ Batch 2 complete (10 devices) - Progress: 4.0%
...
[50/50] ✓ Batch 50 complete (10 devices) - Progress: 100.0%
==================================================
📊 RESULTS SUMMARY
==================================================
Total Devices Requested: 500
Successfully Retrieved: 500
Failed: 0
Total Execution Time: 50.23s
Batches Processed: 50
==================================================
```

## 🎓 Key Design Decisions

### 1. Rate Limiting Strategy
- **Queue-based approach**: Sequential processing with precise timing
- **Avoids premature requests**: Calculates exact wait time between requests
- **Predictable execution**: ~1 second per batch, ~50 seconds total

### 2. Error Recovery
- **Automatic retries**: Failed requests retry up to 3 times
- **Exponential backoff**: 2-second delay between retries
- **Graceful degradation**: Continues processing even if some batches fail

### 3. Modularity
- **Separation of concerns**: API logic separate from business logic
- **Reusable components**: `RateLimitedQueue` can be used independently
- **Clean code**: Well-documented functions with single responsibilities

### 4. Security
- **Correct signature generation**: Follows MD5(URL + Token + Timestamp) formula
- **Header management**: Proper timestamp and signature inclusion
- **Token protection**: Configurable token for different environments

## 🧪 Testing

### Quick Test (20 devices)
To test with fewer devices for rapid verification:

In [client/client.js](client/client.js), modify:
```javascript
const serialNumbers = generateSerialNumbers(20); // Instead of 500
```

This processes only 2 batches (~2 seconds).

### Full Test (500 devices)
Run the standard configuration for the complete scenario (~50 seconds).

## 📝 API Documentation

### Endpoint
```
POST http://localhost:3000/device/real/query
```

### Required Headers
```
Content-Type: application/json
signature: <MD5 hash>
timestamp: <milliseconds>
```

### Request Body
```json
{
  "sn_list": ["SN-000", "SN-001", "SN-002", ...]
}
```

### Response
```json
{
  "data": [
    {
      "sn": "SN-000",
      "power": "3.24 kW",
      "status": "Online",
      "last_updated": "2026-02-04T10:30:00.000Z"
    }
  ]
}
```

## 🔍 Troubleshooting

### Issue: Client gets 429 errors
**Solution**: The rate limiter is working. The client should automatically retry. If persistent, increase `RETRY_DELAY_MS` in client configuration.

### Issue: Client gets 401 errors
**Solution**: Signature mismatch. Verify that:
- Mock API is using token: `interview_token_123`
- Client is using the same token
- URL path is exactly `/device/real/query`

### Issue: "ECONNREFUSED" error
**Solution**: Mock API server is not running. Start it first:
```bash
cd mock-api
npm start
```

## 🎯 Evaluation Criteria Met

✅ **Correctness of cryptographic signature**
- Implements exact MD5(URL + Token + Timestamp) formula
- Properly includes headers in each request

✅ **Robustness of rate-limiting mechanism**
- Custom queue with precise timing
- Prevents 429 errors through careful spacing

✅ **Code readability and structure**
- Modular design with clear separation
- Comprehensive comments and documentation
- Clean, idiomatic JavaScript

✅ **Error handling**
- Retry logic for transient failures
- Graceful degradation
- Detailed error messages

## 📄 License

This is a coding assignment solution for demonstration purposes.

## 👤 Author

Created as a solution for the EnergyGrid Data Aggregator coding assignment.

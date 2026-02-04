# EnergyGrid Client Application

This is the client application that fetches telemetry data from 500 solar inverters through the EnergyGrid Mock API.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Running Mock API server (see `../mock-api/README.md`)

## Installation

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Client

1.  **Ensure the Mock API is running** (in a separate terminal):
    ```bash
    cd ../mock-api
    npm start
    ```

2.  **Run the client application:**
    ```bash
    npm start
    ```
    Or directly:
    ```bash
    node client.js
    ```

## How It Works

### Architecture Overview

The client application implements a robust data aggregation system with the following key components:

#### 1. **Serial Number Generation**
- Generates 500 dummy serial numbers (`SN-000` to `SN-499`)
- Configurable count for easy testing with different scales

#### 2. **Batching Strategy**
- Splits 500 devices into batches of 10 (API constraint)
- Results in 50 total API requests
- Optimizes throughput while respecting batch size limits

#### 3. **Rate Limiting Mechanism**
- **RateLimitedQueue Class**: Custom queue processor that ensures strict 1 request/second
- Uses precise timing to calculate wait intervals between requests
- Prevents 429 errors by maintaining exact spacing between requests

#### 4. **Security Implementation**
- Generates MD5 signature for each request: `MD5(URL + Token + Timestamp)`
- Includes timestamp and signature in headers
- Implements the exact security protocol required by the API

#### 5. **Error Handling & Retries**
- Catches 429 (Too Many Requests) errors
- Implements exponential backoff with configurable retry attempts
- Gracefully handles network failures (e.g., ECONNREFUSED)
- Maximum 3 retry attempts per failed request

#### 6. **Progress Tracking**
- Real-time progress indicators showing batch completion
- Percentage-based progress updates
- Success/failure counts

#### 7. **Data Aggregation**
- Collects all device data into a single unified dataset
- Computes statistics (online vs offline devices)
- Displays summary report with execution time

## Example Output

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

📋 Sample Data (first 5 devices):
  1. SN: SN-000 | Power: 3.24 kW | Status: Online
  2. SN: SN-001 | Power: 4.18 kW | Status: Online
  3. SN: SN-002 | Power: 2.91 kW | Status: Online
  4. SN: SN-003 | Power: 1.67 kW | Status: Offline
  5. SN: SN-004 | Power: 4.52 kW | Status: Online

📈 Device Statistics:
  Online: 451 (90.2%)
  Offline: 49 (9.8%)

✅ Data aggregation complete!
```

## Configuration

You can modify the following constants in `client.js`:

```javascript
const CONFIG = {
  API_URL: 'http://localhost:3000/device/real/query',
  TOKEN: 'interview_token_123',
  RATE_LIMIT_MS: 1000,  // 1 request per second
  BATCH_SIZE: 10,       // Max 10 devices per request
  MAX_RETRIES: 3,       // Max retry attempts
  RETRY_DELAY_MS: 2000  // Delay before retrying
};
```

## Design Decisions

### Rate Limiting Approach
- **Queue-based processing**: Implemented a custom `RateLimitedQueue` class
- **Precise timing**: Calculates exact wait time based on last request timestamp
- **Avoids premature requests**: Ensures compliance with 1 req/sec limit

### Concurrency Strategy
- **Sequential processing**: Batches processed one at a time to maintain rate limit
- **No parallel requests**: Prevents accidental rate limit violations
- **Predictable execution**: Linear time complexity (~1 second per batch)

### Error Recovery
- **Retry logic**: Failed requests automatically retry with exponential backoff
- **Graceful degradation**: Continues processing remaining batches even if one fails
- **Detailed logging**: Clear error messages for debugging

## Assumptions Made

1. **API Availability**: Mock API is running on `localhost:3000`
2. **Token Stability**: Auth token remains constant (`interview_token_123`)
3. **Network Reliability**: Local network connection is stable
4. **Time Synchronization**: Client and server clocks are reasonably synchronized

## Testing

To test with fewer devices (for quick verification):

Modify the serial number count in `client.js`:
```javascript
const serialNumbers = generateSerialNumbers(20); // Instead of 500
```

This will process only 2 batches (~2 seconds) for rapid testing.

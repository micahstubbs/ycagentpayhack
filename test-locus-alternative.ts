/**
 * Try alternative methods to connect to Locus API
 */

import * as dotenv from 'dotenv';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

const API_KEY = process.env.LOCUS_API_KEY!;

console.log('🔍 Testing Alternative Connection Methods to Locus API\n');
console.log('='.repeat(60));

// Method 1: Try IP address instead of domain name (bypass DNS/SNI)
async function testWithIP() {
  console.log('\n\n📍 Method 1: Using IP address instead of hostname\n');

  try {
    // First get the IP
    const dns = require('dns').promises;
    const addresses = await dns.resolve4('api.uselocus.com');
    console.log(`Resolved IPs: ${addresses.join(', ')}`);

    const ip = addresses[0];
    console.log(`Trying IP: ${ip}\n`);

    const response = await fetch(`https://${ip}/v1/payment-context`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Host': 'api.uselocus.com'  // Add Host header manually
      }
    });

    console.log(`✅ Status: ${response.status}`);
    const data = await response.text();
    console.log('Response:', data);
    return true;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

// Method 2: Try older TLS version
async function testWithOlderTLS() {
  console.log('\n\n🔐 Method 2: Trying with TLS 1.2\n');

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.uselocus.com',
      port: 443,
      path: '/v1/payment-context',
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      secureProtocol: 'TLSv1_2_method',
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Method 3: Try HTTP instead of HTTPS (if they support it)
async function testWithHTTP() {
  console.log('\n\n🌐 Method 3: Trying HTTP (non-secure)\n');

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.uselocus.com',
      port: 80,
      path: '/v1/payment-context',
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Failed: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Method 4: Try with custom SNI
async function testWithCustomSNI() {
  console.log('\n\n🔧 Method 4: Trying with custom SNI configuration\n');

  return new Promise((resolve) => {
    const options = {
      host: 'api.uselocus.com',
      port: 443,
      path: '/v1/payment-context',
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      servername: 'api.uselocus.com',
      checkServerIdentity: () => undefined, // Disable server identity check
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Method 5: Try curl as subprocess
async function testWithCurlSubprocess() {
  console.log('\n\n💻 Method 5: Using curl subprocess with --insecure flag\n');

  const { exec } = require('child_process');

  return new Promise((resolve) => {
    const curlCmd = `curl --insecure -H "x-api-key: ${API_KEY}" https://api.uselocus.com/v1/payment-context`;

    exec(curlCmd, (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.log(`❌ Failed: ${stderr || error.message}`);
        resolve(false);
      } else {
        console.log(`✅ Success!`);
        console.log('Response:', stdout);
        resolve(true);
      }
    });
  });
}

// Run all tests
async function runAllTests() {
  const results = {
    ip: await testWithIP(),
    tls12: await testWithOlderTLS(),
    http: await testWithHTTP(),
    sni: await testWithCustomSNI(),
    curl: await testWithCurlSubprocess()
  };

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`IP Address Method:     ${results.ip ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`TLS 1.2 Method:        ${results.tls12 ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`HTTP Method:           ${results.http ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Custom SNI Method:     ${results.sni ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Curl Subprocess:       ${results.curl ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('='.repeat(60));

  const anySuccess = Object.values(results).some(r => r);
  if (anySuccess) {
    console.log('\n✅ At least one method worked! We can integrate with Locus.');
  } else {
    console.log('\n❌ All methods failed. Server-side SSL issue confirmed.');
    console.log('Recommendation: Use mock Locus service for hackathon demo.');
  }
}

runAllTests().catch(console.error);

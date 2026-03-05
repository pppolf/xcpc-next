
import { Buffer } from 'buffer';

const BASE_URL = 'http://localhost:3001/api/ccs';
const USERNAME = 'admin'; // Change this if needed
const PASSWORD = '123456'; // Change this to your actual password

async function testCCS() {
  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${credentials}`,
  };

  try {
    console.log(`Testing CCS API at ${BASE_URL}/contests...`);
    const response = await fetch(`${BASE_URL}/contests/1/problems`, { headers });
    
    if (response.status === 401) {
      console.error('Error: Unauthorized. Please check your username and password.');
      return;
    }

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log('Success! Contests found:', data);
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}

testCCS();

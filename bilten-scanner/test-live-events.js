// Test script to verify live events functionality
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testLiveEvents() {
  console.log('🧪 Testing Live Events Functionality...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    console.log('✅ Backend is running:', healthResponse.data.message);
    console.log('   Timestamp:', healthResponse.data.timestamp);
    console.log('');

    // Test 2: Fetch all events
    console.log('2️⃣ Fetching all events...');
    const eventsResponse = await axios.get(`${API_BASE_URL}/events`);
    const events = eventsResponse.data.data.events;
    console.log(`✅ Found ${events.length} total events`);
    
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title}`);
      console.log(`      Status: ${event.status}`);
      console.log(`      Start: ${new Date(event.start_date).toLocaleString()}`);
      console.log(`      End: ${new Date(event.end_date).toLocaleString()}`);
    });
    console.log('');

    // Test 3: Check for live events
    console.log('3️⃣ Checking for live events...');
    const now = new Date();
    const liveEvents = events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return now >= startDate && now <= endDate;
    });

    console.log(`✅ Found ${liveEvents.length} live events`);
    if (liveEvents.length > 0) {
      liveEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}`);
        console.log(`      Venue: ${event.venue_name}`);
        console.log(`      Time: ${new Date(event.start_date).toLocaleTimeString()} - ${new Date(event.end_date).toLocaleTimeString()}`);
      });
    } else {
      console.log('   ⚠️  No live events found - scanner should be disabled');
    }
    console.log('');

    // Test 4: Test ticket validation
    console.log('4️⃣ Testing ticket validation...');
    const testTicketId = 'ticket-001';
    try {
      const validationResponse = await axios.post(`${API_BASE_URL}/tickets/validate`, {
        ticketId: testTicketId,
        eventId: 'live-event-test-001',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Ticket validation successful');
      console.log('   Result:', validationResponse.data);
    } catch (error) {
      console.log('❌ Ticket validation failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 5: Summary
    console.log('📊 Test Summary:');
    console.log(`   • Backend Status: ✅ Running`);
    console.log(`   • Total Events: ${events.length}`);
    console.log(`   • Live Events: ${liveEvents.length}`);
    console.log(`   • Scanner Should Be: ${liveEvents.length > 0 ? '✅ Enabled' : '❌ Disabled'}`);
    console.log('');

    if (liveEvents.length > 0) {
      console.log('🎉 SUCCESS: Live events found! Scanner should be enabled.');
    } else {
      console.log('⚠️  WARNING: No live events found. Scanner should be disabled.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 3001');
    }
  }
}

// Run the test
testLiveEvents();

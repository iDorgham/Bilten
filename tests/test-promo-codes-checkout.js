const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testPromoCode = {
  code: 'SAVE20',
  name: '20% Off',
  description: 'Save 20% on your order',
  discountType: 'percentage',
  discountValue: 20,
  minimumOrderAmount: 10,
  maxUses: 100,
  maxUsesPerUser: 1,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  isActive: true
};

async function testPromoCodeCheckout() {
  try {
    console.log('🧪 Testing Promo Code Checkout Functionality...\n');

    // 1. Login as test user
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Set auth header
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. Create a test promo code
    console.log('2. Creating test promo code...');
    const createPromoResponse = await axios.post(
      `${API_BASE_URL}/promo-codes`,
      testPromoCode,
      { headers: authHeader }
    );
    const promoCodeId = createPromoResponse.data.data.promoCode.id;
    console.log('✅ Promo code created:', testPromoCode.code, '\n');

    // 3. Test promo code validation
    console.log('3. Testing promo code validation...');
    const validationResponse = await axios.post(
      `${API_BASE_URL}/promo-codes/validate-checkout`,
      {
        code: testPromoCode.code,
        eventId: 'test-event-id',
        orderAmount: 50,
        ticketTypes: ['ticket-1', 'ticket-2']
      },
      { headers: authHeader }
    );

    if (validationResponse.data.data.valid) {
      console.log('✅ Promo code validation successful');
      console.log('   Discount amount:', validationResponse.data.data.discountAmount);
      console.log('   Final amount:', validationResponse.data.data.finalAmount, '\n');
    } else {
      console.log('❌ Promo code validation failed:', validationResponse.data.data.error, '\n');
    }

    // 4. Test payment intent creation with promo code
    console.log('4. Testing payment intent creation with promo code...');
    const paymentIntentResponse = await axios.post(
      `${API_BASE_URL}/payments/create-payment-intent`,
      {
        eventId: 'test-event-id',
        tickets: [
          { ticketId: 'ticket-1', quantity: 2 },
          { ticketId: 'ticket-2', quantity: 1 }
        ],
        promoCode: testPromoCode.code
      },
      { headers: authHeader }
    );

    if (paymentIntentResponse.data.success) {
      console.log('✅ Payment intent created with promo code');
      console.log('   Subtotal:', paymentIntentResponse.data.data.subtotal);
      console.log('   Discount:', paymentIntentResponse.data.data.discountAmount);
      console.log('   Total:', paymentIntentResponse.data.data.total);
      console.log('   Applied promo code:', paymentIntentResponse.data.data.appliedPromoCode?.name, '\n');
    } else {
      console.log('❌ Payment intent creation failed:', paymentIntentResponse.data.message, '\n');
    }

    // 5. Clean up - delete test promo code
    console.log('5. Cleaning up test data...');
    await axios.delete(`${API_BASE_URL}/promo-codes/${promoCodeId}`, { headers: authHeader });
    console.log('✅ Test promo code deleted\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testPromoCodeCheckout();

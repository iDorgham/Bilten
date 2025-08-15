const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/models/index');
const Order = require('../../src/models/Order');
const PromoCode = require('../../src/models/PromoCode');
const User = require('../../src/models/User');
const Event = require('../../src/models/Event');

describe('Order-Promo Code Integration', () => {
  let testUser, testEvent, testPromoCode, authToken;

  beforeAll(async () => {
    // Setup test database
    await db.migrate.latest();
    await db.seed.run();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up test data
    await db('promo_code_usage').del();
    await db('order_items').del();
    await db('orders').del();
    await db('promo_codes').del();
    await db('tickets').del();
    await db('events').del();
    await db('users').del();

    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });

    // Create test event
    testEvent = await Event.create({
      title: 'Test Event',
      description: 'Test event description',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      venueName: 'Test Venue',
      venueAddress: 'Test Address',
      organizerId: testUser.id,
      category: 'music',
      price: 50.00
    });

    // Create test promo code
    testPromoCode = await PromoCode.create({
      code: 'TEST10',
      name: 'Test Discount',
      description: '10% off test orders',
      discountType: 'percentage',
      discountValue: 10.00,
      minimumOrderAmount: 25.00,
      maximumDiscountAmount: 50.00,
      maxUses: 100,
      maxUsesPerUser: 2,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      createdBy: testUser.id
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  describe('Seamless Order Integration', () => {
    it('should create order with promo code successfully', async () => {
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_123',
        items: [
          {
            ticketId: 'ticket_1',
            ticketType: 'general',
            quantity: 2,
            price: 50.00
          }
        ],
        promoCodeId: testPromoCode.id,
        discountAmount: 10.00,
        promoCodeUsed: 'TEST10'
      };

      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order.promo_code_id).toBe(testPromoCode.id);
      expect(order.discount_amount).toBe(10.00);
      expect(order.promo_code_used).toBe('TEST10');
      expect(order.total_amount).toBe(100.00);
    });

    it('should handle orders without promo codes (backward compatibility)', async () => {
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_456',
        items: [
          {
            ticketId: 'ticket_2',
            ticketType: 'vip',
            quantity: 1,
            price: 100.00
          }
        ]
        // No promo code fields - should work fine
      };

      const order = await Order.create(orderData);

      expect(order).toBeDefined();
      expect(order.promo_code_id).toBeNull();
      expect(order.discount_amount).toBe(0);
      expect(order.promo_code_used).toBeNull();
      expect(order.total_amount).toBe(100.00);
    });

    it('should record promo code usage when order is created', async () => {
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_789',
        items: [
          {
            ticketId: 'ticket_3',
            ticketType: 'general',
            quantity: 1,
            price: 100.00
          }
        ],
        promoCodeId: testPromoCode.id,
        discountAmount: 10.00,
        promoCodeUsed: 'TEST10'
      };

      const order = await Order.create(orderData);

      // Check usage record was created
      const usage = await db('promo_code_usage')
        .where({
          promo_code_id: testPromoCode.id,
          user_id: testUser.id,
          order_id: order.id
        })
        .first();

      expect(usage).toBeDefined();
      expect(usage.discount_amount).toBe(10.00);

      // Check promo code count was incremented
      const updatedPromoCode = await PromoCode.findById(testPromoCode.id);
      expect(updatedPromoCode.used_count).toBe(1);
    });
  });

  describe('Order Retrieval with Promo Code Data', () => {
    it('should include promo code information when fetching order by ID', async () => {
      // Create order with promo code
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_retrieve',
        items: [
          {
            ticketId: 'ticket_4',
            ticketType: 'general',
            quantity: 1,
            price: 100.00
          }
        ],
        promoCodeId: testPromoCode.id,
        discountAmount: 10.00,
        promoCodeUsed: 'TEST10'
      };

      const createdOrder = await Order.create(orderData);
      const retrievedOrder = await Order.findById(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder.promo_code_name).toBe('Test Discount');
      expect(retrievedOrder.promo_code_code).toBe('TEST10');
      expect(retrievedOrder.discount_amount).toBe(10.00);
      expect(retrievedOrder.promo_code_used).toBe('TEST10');
    });

    it('should handle orders without promo codes in retrieval', async () => {
      // Create order without promo code
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_no_promo',
        items: [
          {
            ticketId: 'ticket_5',
            ticketType: 'general',
            quantity: 1,
            price: 100.00
          }
        ]
      };

      const createdOrder = await Order.create(orderData);
      const retrievedOrder = await Order.findById(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder.promo_code_name).toBeNull();
      expect(retrievedOrder.promo_code_code).toBeNull();
      expect(retrievedOrder.discount_amount).toBe(0);
      expect(retrievedOrder.promo_code_used).toBeNull();
    });
  });

  describe('API Endpoints Integration', () => {
    it('should validate promo code via API endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/promo-codes/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'TEST10',
          eventId: testEvent.id,
          orderAmount: 100.00
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.promoCode).toBeDefined();
      expect(response.body.promoCode.code).toBe('TEST10');
      expect(response.body.discountAmount).toBe(10.00);
    });

    it('should create order with promo code via API endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventId: testEvent.id,
          items: [
            {
              ticketType: 'general',
              quantity: 2,
              price: 50.00
            }
          ],
          promoCode: 'TEST10',
          totalAmount: 100.00
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.promo_code_id).toBe(testPromoCode.id);
      expect(response.body.order.discount_amount).toBe(10.00);
    });
  });

  describe('Order Statistics with Promo Codes', () => {
    it('should include promo code data in order statistics', async () => {
      // Create multiple orders with and without promo codes
      await Order.create({
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_stats_1',
        items: [{ ticketId: 'ticket_6', ticketType: 'general', quantity: 1, price: 100.00 }],
        promoCodeId: testPromoCode.id,
        discountAmount: 10.00,
        promoCodeUsed: 'TEST10'
      });

      await Order.create({
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 200.00,
        paymentIntentId: 'pi_stats_2',
        items: [{ ticketId: 'ticket_7', ticketType: 'vip', quantity: 1, price: 200.00 }]
        // No promo code
      });

      const stats = await Order.getEventStatistics(testEvent.id);

      expect(stats.orders.total).toBe(2);
      expect(stats.revenue.total).toBe(300.00); // 100 + 200
      expect(stats.tickets).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid promo code gracefully', async () => {
      const orderData = {
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_test_invalid',
        items: [
          {
            ticketId: 'ticket_8',
            ticketType: 'general',
            quantity: 1,
            price: 100.00
          }
        ],
        promoCodeId: 'invalid-uuid',
        discountAmount: 10.00,
        promoCodeUsed: 'INVALID'
      };

      await expect(Order.create(orderData)).rejects.toThrow();
    });

    it('should handle promo code usage limits', async () => {
      // Create a promo code with max uses per user = 1
      const limitedPromoCode = await PromoCode.create({
        code: 'LIMITED1',
        name: 'Limited Use',
        discountType: 'percentage',
        discountValue: 10.00,
        maxUsesPerUser: 1,
        validFrom: new Date(),
        isActive: true,
        createdBy: testUser.id
      });

      // First order should work
      await Order.create({
        userId: testUser.id,
        eventId: testEvent.id,
        totalAmount: 100.00,
        paymentIntentId: 'pi_limit_1',
        items: [{ ticketId: 'ticket_9', ticketType: 'general', quantity: 1, price: 100.00 }],
        promoCodeId: limitedPromoCode.id,
        discountAmount: 10.00,
        promoCodeUsed: 'LIMITED1'
      });

             // Second order with same promo code should fail validation
       const response = await request(app)
         .post('/api/v1/promo-codes/validate')
         .set('Authorization', `Bearer ${authToken}`)
         .send({
           code: 'LIMITED1',
           eventId: testEvent.id,
           orderAmount: 100.00
         });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

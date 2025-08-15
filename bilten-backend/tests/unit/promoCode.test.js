const PromoCode = require('../../src/models/PromoCode');
const db = require('../../src/models');

describe('PromoCode Model', () => {
  let testPromoCode;
  let testUserId;
  let testEventId;

  beforeAll(async () => {
    // Get test user and event IDs
    const users = await db('users').select('id').limit(1);
    const events = await db('events').select('id').limit(1);
    
    testUserId = users[0]?.id;
    testEventId = events[0]?.id;
  });

  beforeEach(async () => {
    // Clean up promo codes before each test
    await db('promo_codes').del();
    await db('promo_code_usage').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('create', () => {
    it('should create a new promo code', async () => {
      const promoCodeData = {
        code: 'TEST10',
        name: 'Test Discount',
        description: 'Test promo code',
        discountType: 'percentage',
        discountValue: 10.00,
        minimumOrderAmount: 25.00,
        maximumDiscountAmount: 50.00,
        maxUses: 100,
        maxUsesPerUser: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: testUserId
      };

      const promoCode = await PromoCode.create(promoCodeData);

      expect(promoCode).toBeDefined();
      expect(promoCode.code).toBe('TEST10');
      expect(promoCode.name).toBe('Test Discount');
      expect(promoCode.discount_type).toBe('percentage');
      expect(promoCode.discount_value).toBe(10.00);
      expect(promoCode.is_active).toBe(true);
    });

    it('should convert code to uppercase', async () => {
      const promoCodeData = {
        code: 'testcode',
        name: 'Test Code',
        discountType: 'fixed_amount',
        discountValue: 5.00,
        validFrom: new Date(),
        createdBy: testUserId
      };

      const promoCode = await PromoCode.create(promoCodeData);
      expect(promoCode.code).toBe('TESTCODE');
    });
  });

  describe('findByCode', () => {
    it('should find promo code by code', async () => {
      const promoCodeData = {
        code: 'FINDME',
        name: 'Find Me',
        discountType: 'percentage',
        discountValue: 15.00,
        validFrom: new Date(),
        createdBy: testUserId
      };

      await PromoCode.create(promoCodeData);
      const found = await PromoCode.findByCode('FINDME');

      expect(found).toBeDefined();
      expect(found.code).toBe('FINDME');
    });

    it('should return null for non-existent code', async () => {
      const found = await PromoCode.findByCode('NONEXISTENT');
      expect(found).toBeNull();
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      testPromoCode = await PromoCode.create({
        code: 'VALID10',
        name: 'Valid Code',
        discountType: 'percentage',
        discountValue: 10.00,
        minimumOrderAmount: 25.00,
        maxUses: 100,
        maxUsesPerUser: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: testUserId
      });
    });

    it('should validate a valid promo code', async () => {
      const result = await PromoCode.validate(
        'VALID10',
        testUserId,
        testEventId,
        [],
        50.00
      );

      expect(result.valid).toBe(true);
      expect(result.promoCode).toBeDefined();
    });

    it('should reject non-existent code', async () => {
      const result = await PromoCode.validate(
        'INVALID',
        testUserId,
        testEventId,
        [],
        50.00
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code not found');
    });

    it('should reject inactive code', async () => {
      await PromoCode.update(testPromoCode.id, { is_active: false });

      const result = await PromoCode.validate(
        'VALID10',
        testUserId,
        testEventId,
        [],
        50.00
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code is inactive');
    });

    it('should reject expired code', async () => {
      await PromoCode.update(testPromoCode.id, {
        valid_until: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      const result = await PromoCode.validate(
        'VALID10',
        testUserId,
        testEventId,
        [],
        50.00
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code has expired');
    });

    it('should reject code with insufficient order amount', async () => {
      const result = await PromoCode.validate(
        'VALID10',
        testUserId,
        testEventId,
        [],
        10.00
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum order amount');
    });

    it('should reject code when usage limit exceeded', async () => {
      await PromoCode.update(testPromoCode.id, { used_count: 100 });

      const result = await PromoCode.validate(
        'VALID10',
        testUserId,
        testEventId,
        [],
        50.00
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code usage limit exceeded');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const promoCode = {
        discount_type: 'percentage',
        discount_value: 20.00,
        maximum_discount_amount: 50.00
      };

      const discount = PromoCode.calculateDiscount(promoCode, 100.00);
      expect(discount).toBe(20.00);
    });

    it('should calculate fixed amount discount correctly', () => {
      const promoCode = {
        discount_type: 'fixed_amount',
        discount_value: 15.00
      };

      const discount = PromoCode.calculateDiscount(promoCode, 100.00);
      expect(discount).toBe(15.00);
    });

    it('should respect maximum discount amount', () => {
      const promoCode = {
        discount_type: 'percentage',
        discount_value: 50.00,
        maximum_discount_amount: 25.00
      };

      const discount = PromoCode.calculateDiscount(promoCode, 100.00);
      expect(discount).toBe(25.00);
    });

    it('should not exceed order amount', () => {
      const promoCode = {
        discount_type: 'fixed_amount',
        discount_value: 50.00
      };

      const discount = PromoCode.calculateDiscount(promoCode, 25.00);
      expect(discount).toBe(25.00);
    });
  });

  describe('recordUsage', () => {
    let testOrderId;

    beforeEach(async () => {
      testPromoCode = await PromoCode.create({
        code: 'USAGE10',
        name: 'Usage Test',
        discountType: 'percentage',
        discountValue: 10.00,
        validFrom: new Date(),
        createdBy: testUserId
      });

      // Create a test order
      const [order] = await db('orders').insert({
        user_id: testUserId,
        event_id: testEventId,
        total_amount: 100.00,
        status: 'pending'
      }).returning('id');
      
      testOrderId = order.id;
    });

    it('should record usage and increment count', async () => {
      const initialCount = testPromoCode.used_count;
      const discountAmount = 10.00;

      await PromoCode.recordUsage(testPromoCode.id, testUserId, testOrderId, discountAmount);

      // Check usage record was created
      const usage = await db('promo_code_usage')
        .where({
          promo_code_id: testPromoCode.id,
          user_id: testUserId,
          order_id: testOrderId
        })
        .first();

      expect(usage).toBeDefined();
      expect(usage.discount_amount).toBe(discountAmount);

      // Check promo code count was incremented
      const updatedPromoCode = await PromoCode.findById(testPromoCode.id);
      expect(updatedPromoCode.used_count).toBe(initialCount + 1);
    });
  });

  describe('getUsageStats', () => {
    beforeEach(async () => {
      testPromoCode = await PromoCode.create({
        code: 'STATS10',
        name: 'Stats Test',
        discountType: 'percentage',
        discountValue: 10.00,
        validFrom: new Date(),
        createdBy: testUserId
      });
    });

    it('should return usage statistics', async () => {
      // Create some usage records
      const order1 = await db('orders').insert({
        user_id: testUserId,
        event_id: testEventId,
        total_amount: 100.00,
        status: 'pending'
      }).returning('id');

      const order2 = await db('orders').insert({
        user_id: testUserId,
        event_id: testEventId,
        total_amount: 200.00,
        status: 'pending'
      }).returning('id');

      await PromoCode.recordUsage(testPromoCode.id, testUserId, order1[0].id, 10.00);
      await PromoCode.recordUsage(testPromoCode.id, testUserId, order2[0].id, 20.00);

      const stats = await PromoCode.getUsageStats(testPromoCode.id);

      expect(stats.total_uses).toBe(2);
      expect(stats.unique_users).toBe(1);
      expect(stats.total_discount_given).toBe(30.00);
    });
  });

  describe('findActive', () => {
    beforeEach(async () => {
      await PromoCode.create({
        code: 'ACTIVE1',
        name: 'Active Code 1',
        discountType: 'percentage',
        discountValue: 10.00,
        validFrom: new Date(),
        isActive: true,
        createdBy: testUserId
      });

      await PromoCode.create({
        code: 'INACTIVE1',
        name: 'Inactive Code 1',
        discountType: 'percentage',
        discountValue: 10.00,
        validFrom: new Date(),
        isActive: false,
        createdBy: testUserId
      });
    });

    it('should return only active promo codes', async () => {
      const activeCodes = await PromoCode.findActive();
      
      expect(activeCodes.length).toBe(1);
      expect(activeCodes[0].code).toBe('ACTIVE1');
    });

    it('should filter by event ID', async () => {
      const eventSpecificCode = await PromoCode.create({
        code: 'EVENT1',
        name: 'Event Specific',
        discountType: 'percentage',
        discountValue: 10.00,
        validFrom: new Date(),
        applicableEvents: JSON.stringify([testEventId]),
        createdBy: testUserId
      });

      const activeCodes = await PromoCode.findActive({ eventId: testEventId });
      
      expect(activeCodes.some(code => code.id === eventSpecificCode.id)).toBe(true);
    });
  });
});

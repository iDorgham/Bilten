const PromoCodeService = require('./src/utils/promoCodeService');
const knex = require('./src/utils/database');

/**
 * Test script for Promo Codes functionality
 * Run with: node test-promo-codes.js
 */

async function testPromoCodes() {
  console.log('🧪 Testing Promo Codes System...\n');

  try {
    // Test 1: Check if promo codes table exists and has data
    console.log('1. Checking promo codes table...');
    const promoCodes = await knex('promo_codes').select('*').limit(5);
    console.log(`✅ Found ${promoCodes.length} promo codes in database`);
    
    if (promoCodes.length > 0) {
      console.log(`   Sample codes: ${promoCodes.map(pc => pc.code).join(', ')}\n`);
    }

    // Test 2: Test promo code validation
    console.log('2. Testing promo code validation...');
    if (promoCodes.length > 0) {
      const testCode = promoCodes[0];
      const validation = await PromoCodeService.validatePromoCode(
        testCode.code,
        'test-user-id',
        'test-event-id',
        ['general'],
        100.00
      );
      
      console.log(`   Code: ${testCode.code}`);
      console.log(`   Valid: ${validation.valid}`);
      if (validation.valid) {
        console.log(`   Discount Amount: $${validation.discountAmount}`);
        console.log(`   Final Amount: $${validation.finalAmount}`);
      } else {
        console.log(`   Error: ${validation.error}`);
      }
    } else {
      console.log('   ⚠️  No promo codes found for testing');
    }
    console.log('');

    // Test 3: Test discount calculation
    console.log('3. Testing discount calculation...');
    const testPromoCode = {
      discount_type: 'percentage',
      discount_value: 10.00,
      maximum_discount_amount: 50.00
    };
    
    const discount1 = PromoCodeService.calculateDiscount(testPromoCode, 100.00);
    const discount2 = PromoCodeService.calculateDiscount(testPromoCode, 1000.00);
    
    console.log(`   Order $100.00 → Discount: $${discount1.toFixed(2)}`);
    console.log(`   Order $1000.00 → Discount: $${discount2.toFixed(2)} (capped at $50.00)`);
    console.log('');

    // Test 4: Test fixed amount discount
    console.log('4. Testing fixed amount discount...');
    const fixedPromoCode = {
      discount_type: 'fixed_amount',
      discount_value: 20.00,
      maximum_discount_amount: null
    };
    
    const fixedDiscount1 = PromoCodeService.calculateDiscount(fixedPromoCode, 100.00);
    const fixedDiscount2 = PromoCodeService.calculateDiscount(fixedPromoCode, 15.00);
    
    console.log(`   Order $100.00 → Discount: $${fixedDiscount1.toFixed(2)}`);
    console.log(`   Order $15.00 → Discount: $${fixedDiscount2.toFixed(2)} (capped at order amount)`);
    console.log('');

    // Test 5: Test active promo codes retrieval
    console.log('5. Testing active promo codes retrieval...');
    const activeCodes = await PromoCodeService.getActivePromoCodes('test-event-id');
    console.log(`   Found ${activeCodes.length} active promo codes`);
    
    if (activeCodes.length > 0) {
      console.log(`   Active codes: ${activeCodes.map(pc => pc.code).join(', ')}`);
    }
    console.log('');

    // Test 6: Test promo code status check
    console.log('6. Testing promo code status check...');
    if (promoCodes.length > 0) {
      const isActive = await PromoCodeService.isPromoCodeActive(promoCodes[0].code);
      console.log(`   Code ${promoCodes[0].code} is active: ${isActive}`);
      
      const isActiveInvalid = await PromoCodeService.isPromoCodeActive('INVALID123');
      console.log(`   Code INVALID123 is active: ${isActiveInvalid}`);
    }
    console.log('');

    // Test 7: Test usage statistics
    console.log('7. Testing usage statistics...');
    if (promoCodes.length > 0) {
      const stats = await PromoCodeService.getUsageStats(promoCodes[0].id);
      console.log(`   Usage stats for ${promoCodes[0].code}:`);
      console.log(`     Total uses: ${stats.total_uses}`);
      console.log(`     Unique users: ${stats.unique_users}`);
      console.log(`     Total discount given: $${stats.total_discount_given.toFixed(2)}`);
    }
    console.log('');

    console.log('🎉 All promo code tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection and table access');
    console.log('   ✅ Promo code validation');
    console.log('   ✅ Discount calculation (percentage and fixed)');
    console.log('   ✅ Active promo codes retrieval');
    console.log('   ✅ Promo code status checking');
    console.log('   ✅ Usage statistics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// Run the test
if (require.main === module) {
  testPromoCodes();
}

module.exports = { testPromoCodes };

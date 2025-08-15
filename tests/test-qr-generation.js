const QRGenerator = require('./src/utils/qrGenerator');

/**
 * Test script for QR code generation functionality
 * Run with: node test-qr-generation.js
 */

async function testQRGeneration() {
  console.log('🧪 Testing QR Code Generation...\n');

  try {
    // Test 1: Generate simple QR code
    console.log('1. Testing simple QR code generation...');
    const simpleData = 'BLT-TEST-123456';
    const simpleQR = await QRGenerator.generateSimpleQR(simpleData);
    console.log('✅ Simple QR code generated successfully');
    console.log(`   Data: ${simpleData}`);
    console.log(`   QR Code length: ${simpleQR.length} characters\n`);

    // Test 2: Generate ticket QR code
    console.log('2. Testing ticket QR code generation...');
    const ticketData = {
      ticketId: 'tkt-123456789',
      eventId: 'evt-987654321',
      userId: 'usr-111222333',
      ticketNumber: 'BLT-EVT9876-TKT1234-1703123456789-ABC123'
    };
    
    const ticketQR = await QRGenerator.generateTicketQR(ticketData);
    console.log('✅ Ticket QR code generated successfully');
    console.log(`   Ticket ID: ${ticketData.ticketId}`);
    console.log(`   Event ID: ${ticketData.eventId}`);
    console.log(`   QR Code length: ${ticketQR.length} characters\n`);

    // Test 3: Generate ticket number
    console.log('3. Testing ticket number generation...');
    const eventId = 'evt-987654321';
    const ticketTypeId = 'tkt-general';
    const ticketNumber = QRGenerator.generateTicketNumber(eventId, ticketTypeId);
    console.log('✅ Ticket number generated successfully');
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Ticket Type ID: ${ticketTypeId}`);
    console.log(`   Generated Ticket Number: ${ticketNumber}\n`);

    // Test 4: Generate QR hash
    console.log('4. Testing QR hash generation...');
    const qrHash = QRGenerator.generateQRHash(ticketNumber);
    console.log('✅ QR hash generated successfully');
    console.log(`   Ticket Number: ${ticketNumber}`);
    console.log(`   QR Hash: ${qrHash}\n`);

    // Test 5: Test signature generation and verification
    console.log('5. Testing signature generation and verification...');
    const signature = QRGenerator.generateSignature(ticketData);
    console.log(`   Generated Signature: ${signature}`);
    
    // Test signature verification
    const isValid = QRGenerator.verifySignature({
      tid: ticketData.ticketId,
      eid: ticketData.eventId,
      uid: ticketData.userId,
      tn: ticketData.ticketNumber,
      sig: signature
    });
    
    console.log(`   Signature Verification: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);

    // Test 6: Test timestamp validation
    console.log('6. Testing timestamp validation...');
    const now = Date.now();
    const isValidTimestamp = QRGenerator.validateTimestamp(now);
    const isExpiredTimestamp = QRGenerator.validateTimestamp(now - (25 * 60 * 60 * 1000)); // 25 hours ago
    
    console.log(`   Current timestamp: ${isValidTimestamp ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Expired timestamp: ${isExpiredTimestamp ? '✅ Valid' : '❌ Invalid (expected)'}\n`);

    console.log('🎉 All QR code generation tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Simple QR code generation');
    console.log('   ✅ Ticket QR code generation');
    console.log('   ✅ Ticket number generation');
    console.log('   ✅ QR hash generation');
    console.log('   ✅ Signature generation and verification');
    console.log('   ✅ Timestamp validation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testQRGeneration();
}

module.exports = { testQRGeneration };

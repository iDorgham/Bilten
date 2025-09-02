#!/usr/bin/env node

/**
 * Payment Integration Setup Script
 * 
 * This script helps set up the complete payment processing integration
 * including Stripe configuration, webhook setup, and environment variables.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupPaymentIntegration() {
  console.log('🚀 Bilten Payment Integration Setup\n');
  console.log('This script will help you configure payment processing for your Bilten platform.\n');

  try {
    // 1. Check if .env file exists
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), 'config', 'env', 'deploy.env.prod.example');
    
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env file from template...');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created successfully');
      } else {
        console.log('❌ Environment template not found');
        return;
      }
    }

    // 2. Get Stripe configuration
    console.log('\n🔑 Stripe Configuration');
    console.log('You can find these values in your Stripe Dashboard: https://dashboard.stripe.com/apikeys\n');
    
    const stripeSecretKey = await question('Enter your Stripe Secret Key (starts with sk_test_ or sk_live_): ');
    const stripePublishableKey = await question('Enter your Stripe Publishable Key (starts with pk_test_ or pk_live_): ');
    
    // 3. Get webhook configuration
    console.log('\n🔗 Webhook Configuration');
    console.log('You\'ll need to set up a webhook in your Stripe Dashboard: https://dashboard.stripe.com/webhooks\n');
    console.log('Webhook URL: https://your-domain.com/api/v1/payment/webhook');
    console.log('Events to listen for: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded\n');
    
    const webhookSecret = await question('Enter your Stripe Webhook Secret (starts with whsec_): ');
    
    // 4. Update .env file
    console.log('\n📝 Updating .env file...');
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace Stripe configuration
    envContent = envContent.replace(
      /STRIPE_SECRET_KEY=.*/,
      `STRIPE_SECRET_KEY=${stripeSecretKey}`
    );
    
    envContent = envContent.replace(
      /STRIPE_PUBLISHABLE_KEY=.*/,
      `STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}`
    );
    
    envContent = envContent.replace(
      /STRIPE_WEBHOOK_SECRET=.*/,
      `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
    );
    
    // Add frontend Stripe key
    if (!envContent.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY')) {
      envContent += `\nREACT_APP_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully');

    // 5. Database setup
    console.log('\n🗄️  Database Setup');
    console.log('Running database migrations...');
    
    const { execSync } = require('child_process');
    try {
      execSync('npm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.log('⚠️  Database migration failed. Please run manually: npm run db:migrate');
    }

    // 6. Test configuration
    console.log('\n🧪 Testing Configuration');
    console.log('Testing Stripe connection...');
    
    try {
      // Test Stripe connection
      const stripe = require('stripe')(stripeSecretKey);
      const account = await stripe.accounts.retrieve();
      console.log(`✅ Stripe connection successful (Account: ${account.id})`);
    } catch (error) {
      console.log('❌ Stripe connection failed. Please check your API keys.');
      console.log('Error:', error.message);
    }

    // 7. Final instructions
    console.log('\n🎉 Payment Integration Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test the payment flow with a test card: 4242 4242 4242 4242');
    console.log('3. Set up webhooks in your Stripe Dashboard for production');
    console.log('4. Configure your domain in the webhook URL');
    console.log('\n📚 Documentation:');
    console.log('- Backend API: /api/v1/payment/*');
    console.log('- Frontend Components: /src/components/PaymentForm.js');
    console.log('- Payment Routes: /checkout/:eventId');
    console.log('\n🔧 Available Commands:');
    console.log('- npm run dev: Start development environment');
    console.log('- npm run test:payment: Run payment integration tests');
    console.log('- npm run health: Check service health');
    console.log('\n💳 Test Cards:');
    console.log('- Success: 4242 4242 4242 4242');
    console.log('- Decline: 4000 0000 0000 0002');
    console.log('- 3D Secure: 4000 0025 0000 3155');
    console.log('\n🔒 Security Notes:');
    console.log('- Never commit your .env file to version control');
    console.log('- Use test keys for development, live keys for production');
    console.log('- Set up webhook signature verification for security');
    console.log('\n📞 Support:');
    console.log('- Stripe Documentation: https://stripe.com/docs');
    console.log('- Bilten Documentation: /docs/api/payment-integration.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
if (require.main === module) {
  setupPaymentIntegration();
}

module.exports = { setupPaymentIntegration };

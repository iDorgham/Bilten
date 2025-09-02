import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Only load Stripe if the key is available
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);

const StripeProvider = ({ children }) => {
  // If no Stripe key is configured, render children without Stripe
  if (!stripePublishableKey) {
    console.warn('Stripe publishable key not found. Stripe functionality will be disabled.');
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;

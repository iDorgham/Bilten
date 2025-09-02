import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
import axios from 'axios';

const Checkout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEventDetails();
  }, [eventId, user, navigate]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`/api/v1/events/${eventId}`);
      setEvent(response.data);
    } catch (err) {
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    navigate('/payment/success', { 
      state: { paymentIntent, event } 
    });
  };

  const handlePaymentError = (error) => {
    setError('Payment failed. Please try again.');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!event) {
    return <div className="text-center py-8">Event not found</div>;
  }

  const ticketPrice = event.ticketTypes?.[0]?.price || 0;
  const totalAmount = ticketPrice * 100; // Convert to cents

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="text-lg font-semibold">
              Total: ${ticketPrice}
            </div>
          </div>

          {/* Payment Form */}
          <StripeProvider>
            <PaymentForm
              amount={totalAmount}
              currency="usd"
              eventId={eventId}
              orderId={`order_${Date.now()}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </StripeProvider>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

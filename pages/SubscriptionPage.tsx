
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { StripeConfig, User } from '../types'; // Assuming StripeConfig type is defined
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, CreditCard, Settings, Crown, ShieldAlert } from 'lucide-react';

// Ensure StripePromise is initialized only once
let stripePromise: Promise<Stripe | null> | null = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      const config = await apiService.get<StripeConfig>('/config/stripe');
      if (config && config.publishableKey) {
        stripePromise = loadStripe(config.publishableKey);
      } else {
        console.error("Stripe publishable key not found in config.");
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch Stripe config:", error);
      return null;
    }
  }
  return stripePromise;
};


const SubscriptionPage: React.FC = () => {
  const { user, fetchCurrentUser, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for Stripe checkout session status from URL query params
    const queryParams = new URLSearchParams(location.search);
    const checkoutStatus = queryParams.get('checkout_status');
    // const sessionId = queryParams.get('session_id'); // Can be used to verify/fetch session details if needed

    if (checkoutStatus === 'success') {
      setMessage('Subscription successful! Your plan has been updated.');
      fetchCurrentUser(); // Refresh user data to get updated plan
      navigate('/subscription', { replace: true }); // Clear query params
    } else if (checkoutStatus === 'canceled') {
      setError('Subscription process was canceled. Your plan has not changed.');
      navigate('/subscription', { replace: true }); // Clear query params
    }
  }, [location.search, fetchCurrentUser, navigate]);


  const handleUpgradeToPremium = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const stripe = await getStripePromise();
      if (!stripe) {
        throw new Error("Stripe.js failed to load or configuration is missing.");
      }

      const { sessionId, url } = await apiService.post<{ sessionId: string, url: string }>('/stripe/create-checkout-session');
      if (url) { // Stripe might return a URL for some checkout flows
        window.location.href = url;
      } else if (sessionId) { // Standard flow is redirectToCheckout with sessionId
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        if (stripeError) {
          throw new Error(stripeError.message || "Failed to redirect to Stripe Checkout.");
        }
      } else {
        throw new Error("Could not initiate Stripe Checkout session.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start subscription process. Please try again.');
      setIsLoading(false);
    }
    // setIsLoading(false) will not be reached if redirectToCheckout is successful
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { url } = await apiService.post<{ url: string }>('/stripe/customer-portal-session');
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Could not open customer portal.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open customer management portal. Please try again.');
      setIsLoading(false);
    }
  };
  
  const PlanCard: React.FC<{
    title: string;
    price: string;
    features: string[];
    isCurrentUserPlan?: boolean;
    isPremium?: boolean;
    actionButton?: React.ReactNode;
    icon: React.ReactNode;
  }> = ({ title, price, features, isCurrentUserPlan, isPremium, actionButton, icon }) => (
    <div className={`bg-white p-6 rounded-lg shadow-lg border-2 ${isCurrentUserPlan ? (isPremium ? 'border-accent' : 'border-primary') : 'border-gray-200'} transform transition-all duration-300 ${isCurrentUserPlan ? 'scale-105' : 'hover:shadow-xl'}`}>
      <div className="flex items-center mb-4">
        {icon}
        <h3 className={`text-2xl font-semibold ml-3 ${isPremium ? 'text-accent' : 'text-primary'}`}>{title}</h3>
      </div>
      <p className="text-3xl font-bold text-neutral mb-1">{price}</p>
      <p className="text-sm text-gray-500 mb-6">{price === 'Free' ? 'Forever' : 'Per Month'}</p>
      <ul className="space-y-2 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-700">
            <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0" /> {feature}
          </li>
        ))}
      </ul>
      {actionButton}
      {isCurrentUserPlan && <p className="text-center mt-4 text-sm font-semibold text-green-600">This is your current plan.</p>}
    </div>
  );


  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }
  if (!user) {
    return <div className="text-center py-10">
        <p className="text-xl">Please <a href="/login" className="text-primary underline">log in</a> to manage your subscription.</p>
    </div>;
  }
  
  const isUserAdmin = user.role === 'admin';
  const isUserPremium = user.planType === 'premium' && (user.stripeSubscriptionStatus === 'active' || user.stripeSubscriptionStatus === 'trialing');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Subscription Management</h1>
        <p className="text-lg text-neutral">Manage your Green Shield plan and billing details.</p>
      </div>

      {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {isUserAdmin && (
        <div className="bg-blue-50 p-4 rounded-lg shadow text-blue-700 flex items-center">
          <ShieldAlert size={24} className="mr-3 text-blue-500"/>
          <p>As an Administrator, you have full access to all features. Subscription plans do not apply to admin accounts.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <PlanCard
          title="Free Plan"
          price="Free"
          icon={<CheckCircle size={32} className="text-primary"/>}
          features={[
            "Up to 5 disease detections per month",
            "Basic disease information",
            "Community support"
          ]}
          isCurrentUserPlan={!isUserPremium && !isUserAdmin}
          actionButton={
            !isUserPremium && !isUserAdmin ? (
              <button disabled className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-default">
                Your Current Plan
              </button>
            ) : null
          }
        />
        <PlanCard
          title="Premium Plan"
          price="$5" // This should match your Stripe Price. For display only.
          icon={<Crown size={32} className="text-accent"/>}
          features={[
            "Unlimited disease detections",
            "Detailed disease information & insights",
            "Priority support",
            "Access to new features first"
          ]}
          isCurrentUserPlan={isUserPremium && !isUserAdmin}
          isPremium={true}
          actionButton={
            !isUserAdmin && (
              isUserPremium ? (
                <button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full bg-secondary hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Spinner size="sm" color="text-white"/> : <><Settings size={20} className="mr-2"/> Manage Subscription</>}
                </button>
              ) : (
                <button 
                  onClick={handleUpgradeToPremium}
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Spinner size="sm" color="text-white"/> : <><CreditCard size={20} className="mr-2"/> Upgrade to Premium</>}
                </button>
              )
            )
          }
        />
      </div>
       {user.stripeSubscriptionStatus && user.stripeSubscriptionStatus !== 'active' && user.stripeSubscriptionStatus !== 'trialing' && (
            <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-center">
                <p>Your subscription status is currently: <strong className="capitalize">{user.stripeSubscriptionStatus.replace('_', ' ')}</strong>.</p>
                { (user.stripeSubscriptionStatus === 'past_due' || user.stripeSubscriptionStatus === 'incomplete') &&
                    <p>Please update your payment information to reactivate your premium features.</p>
                }
                 { user.stripeSubscriptionStatus === 'canceled' &&
                    <p>Your premium benefits will end soon, or have already ended.</p>
                }
            </div>
        )}
    </div>
  );
};

export default SubscriptionPage;

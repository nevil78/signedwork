import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: any) => void;
}

export function RazorpayCheckout({ planId, planName, amount, currency, onSuccess, onError }: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      toast({
        title: "Script Load Error",
        description: "Failed to load Razorpay checkout script",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [toast]);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      toast({
        title: "Not Ready",
        description: "Payment system is still loading. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderResponse = await apiRequest("POST", "/api/payments/create-order", {
        planId
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RFmDd3Fx2rsZF4', // Use live key
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Signedwork',
        description: `Subscription to ${planName}`,
        image: '/logo.png', // Add your logo
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await apiRequest("POST", "/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId: orderData.transactionId,
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              toast({
                title: "Payment Successful! 🎉",
                description: `Welcome to ${planName}! Your subscription is now active.`,
              });
              onSuccess?.(response.razorpay_payment_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Payment was processed but verification failed. Please contact support.",
              variant: "destructive"
            });
            onError?.(error);
          }
        },
        prefill: {
          name: '', // Will be filled by Razorpay from user session
          email: '',
        },
        notes: {
          planId,
          planName,
        },
        theme: {
          color: '#3B82F6' // Blue color matching your theme
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled. You can try again anytime.",
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Not authenticated') || error.message?.includes('401') || 
          error.toString?.().includes('401') || error.toString?.().includes('Not authenticated')) {
        toast({
          title: "Login Required",
          description: "Please log in to subscribe to a plan",
          variant: "destructive",
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/auth?view=login&accountType=employee&redirect=subscription';
        }, 2000);
        return;
      }
      
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
      onError?.(error);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className="w-full"
      data-testid="button-razorpay-checkout"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Processing...' : `Pay ₹${amount / 100} for ${planName}`}
    </Button>
  );
}
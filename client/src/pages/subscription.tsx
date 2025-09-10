import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RazorpayCheckout } from "@/components/RazorpayCheckout";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Star, Zap, Users, Building, X } from "lucide-react";
import { useState } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";

interface SubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
  maxEmployees?: number;
  maxWorkEntries?: number;
  isActive: boolean;
}

interface UserSubscription {
  id: string;
  subscriptionId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: SubscriptionPlan;
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["/api/payments/plans"],
    queryFn: async () => {
      try {
        // Use direct fetch to handle 304 responses properly
        const response = await fetch("/api/payments/plans", {
          credentials: "include",
        });
        
        console.log('API Response:', response.status, response.ok);
        
        // 200 = success, 304 = not modified (cached, still valid)
        if (response.ok || response.status === 304) {
          const data = await response.json();
          console.log('Plans received:', data);
          return data;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // This is now a public pricing page - no authentication needed

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/subscription/cancel");
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/subscription"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  });

  const handlePaymentSuccess = (paymentId: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/payments/subscription"] });
    setSelectedPlan(null);
  };

  const handlePaymentError = (error: any) => {
    setSelectedPlan(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'pro':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'enterprise':
        return <Building className="h-6 w-6 text-orange-500" />;
      default:
        return <Zap className="h-6 w-6 text-green-500" />;
    }
  };

  const getPopularBadge = (planName: string) => {
    if (planName.toLowerCase() === 'pro') {
      return <Badge variant="destructive" className="absolute -top-2 -right-2">Most Popular</Badge>;
    }
    return null;
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Plans</h2>
          <p className="text-gray-600">{plansError?.message || 'Failed to load subscription plans'}</p>
          <p className="text-sm text-gray-500 mt-2">Debug: Check browser console for more details</p>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('Plans data:', plans);
  console.log('Plans length:', plans?.length);
  console.log('Plans error:', plansError);
  console.log('Loading state:', plansLoading);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <UnifiedHeader showBackButton={true} showAuthButtons={true} currentPage="landing" />
      
      <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Signedwork Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the full potential of professional networking and work management. 
            Get verified work entries, unlimited connections, and premium features.
          </p>
        </div>

        {/* Notice for visitors */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Transform Your Professional Network?</h3>
          <p className="text-blue-700 mb-4">Join thousands of professionals and companies already using Signedwork</p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => window.location.href = '/auth?view=company'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth?view=login'}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        {plans.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">No subscription plans found. Check console for details.</p>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans && plans.length > 0 ? plans.map((plan: SubscriptionPlan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.name.toLowerCase() === 'pro' ? 'border-purple-200 shadow-lg scale-105' : ''
              }`}
            >
              {getPopularBadge(plan.name)}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹{plan.amount / 100}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.maxEmployees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">Up to {plan.maxEmployees} employees</span>
                    </div>
                  )}
                  {plan.maxWorkEntries && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm">Up to {plan.maxWorkEntries} work entries/month</span>
                    </div>
                  )}
                </div>
                
                <Separator className="mb-6" />
                
                {/* Public pricing page - redirect to company signup */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    window.location.href = '/auth?view=company&selectedPlan=' + plan.id;
                  }}
                  data-testid={`button-get-started-${plan.name.toLowerCase()}`}
                >
                  Get Started with {plan.name}
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No subscription plans available at the moment.</p>
            </div>
          )}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6">Features</th>
                  {plans.map((plan: SubscriptionPlan) => (
                    <th key={plan.id} className="text-center py-4 px-6">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6">Verified Work Entries</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6">Company Dashboard</td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6">Priority Support</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6">API Access</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Shield, Building2, Mail, Phone, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyNavHeader from "@/components/company-nav-header";
import { useCompanyAuth } from "@/hooks/useCompanyAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CompanyAdminSettings() {
  const [, navigate] = useLocation();
  const { companySubRole, isLoading: isAuthLoading } = useCompanyAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Role-based access control
  useEffect(() => {
    if (!isAuthLoading && companySubRole !== 'COMPANY_ADMIN') {
      navigate('/company/403');
    }
  }, [companySubRole, isAuthLoading, navigate]);

  // Fetch company settings
  const { data: company, isLoading } = useQuery({
    queryKey: ['/api/company/admin/settings'],
    enabled: companySubRole === 'COMPANY_ADMIN',
  });

  // Update company settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/company/admin/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Company settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/admin/settings'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      website: formData.get('website'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
      country: formData.get('country'),
    };
    updateSettings.mutate(data);
  };

  if (!companySubRole || companySubRole !== 'COMPANY_ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CompanyNavHeader />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyNavHeader />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-admin-settings">
              Company Settings
            </h1>
          </div>
          <p className="text-gray-600">
            Manage company information, verification status, and platform configuration.
          </p>
        </div>

        {/* Company Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic company details and contact information
                </CardDescription>
              </div>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-settings"
                >
                  Edit Settings
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={(company as any)?.name || ''}
                    disabled={!isEditing}
                    required
                    data-testid="input-company-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={(company as any)?.website || ''}
                    disabled={!isEditing}
                    placeholder="https://www.company.com"
                    data-testid="input-company-website"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={(company as any)?.description || ''}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Describe your company..."
                  data-testid="textarea-company-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={(company as any)?.email || ''}
                      disabled={!isEditing}
                      className="pl-10"
                      data-testid="input-company-email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={(company as any)?.phoneNumber || ''}
                      disabled={!isEditing}
                      className="pl-10"
                      data-testid="input-company-phone"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={(company as any)?.address || ''}
                    disabled={!isEditing}
                    data-testid="input-company-address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={(company as any)?.city || ''}
                      disabled={!isEditing}
                      data-testid="input-company-city"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={(company as any)?.state || ''}
                      disabled={!isEditing}
                      data-testid="input-company-state"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      defaultValue={(company as any)?.zipCode || ''}
                      disabled={!isEditing}
                      data-testid="input-company-zip"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={(company as any)?.country || ''}
                    disabled={!isEditing}
                    data-testid="input-company-country"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateSettings.isPending}
                    data-testid="button-save-settings"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettings.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
            </CardTitle>
            <CardDescription>
              Company verification and compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-gray-600">Verify your company email address</p>
                </div>
                <div className="text-right">
                  {(company as any)?.emailVerified ? (
                    <div className="text-green-600 font-medium">✓ Verified</div>
                  ) : (
                    <div className="text-yellow-600 font-medium">⚠ Pending</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">PAN Verification</h4>
                  <p className="text-sm text-gray-600">Business PAN verification status</p>
                </div>
                <div className="text-right">
                  {(company as any)?.panVerificationStatus === 'verified' ? (
                    <div className="text-green-600 font-medium">✓ Verified</div>
                  ) : (
                    <div className="text-yellow-600 font-medium">⚠ Pending</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">CIN Verification</h4>
                  <p className="text-sm text-gray-600">Corporate identification verification</p>
                </div>
                <div className="text-right">
                  {(company as any)?.cinVerificationStatus === 'verified' ? (
                    <div className="text-green-600 font-medium">✓ Verified</div>
                  ) : (
                    <div className="text-yellow-600 font-medium">⚠ Pending</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
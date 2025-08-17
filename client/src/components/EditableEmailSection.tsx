import { useState } from 'react';
import { Edit, Mail, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

interface EditableEmailSectionProps {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
}

export function EditableEmailSection({ user }: EditableEmailSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user.email,
    },
  });

  // Update email mutation
  const updateEmail = useMutation({
    mutationFn: async (data: { email: string }) => {
      return await apiRequest('PATCH', '/api/employee/email', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/profile'] });
      setIsEditing(false);
      toast({
        title: 'Email Updated',
        description: 'Your email has been updated. Verification status has been reset.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email',
        variant: 'destructive',
      });
    },
  });

  // Send verification email mutation
  const sendVerification = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/employee/send-verification-email', {});
    },
    onSuccess: () => {
      toast({
        title: 'Verification Email Sent',
        description: 'Check your email for the verification code.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification email',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (data: { email: string }) => {
    if (data.email === user.email) {
      setIsEditing(false);
      return;
    }
    updateEmail.mutate(data);
  };

  const handleCancel = () => {
    form.reset({ email: user.email });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Address
          </div>
          {user.emailVerified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Input
                {...form.register('email')}
                placeholder="Enter your email address"
                className="w-full"
                data-testid="input-edit-email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changing your email will reset your verification status. You'll need to verify the new email address.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                size="sm"
                disabled={updateEmail.isPending}
                data-testid="button-save-email"
              >
                {updateEmail.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                data-testid="button-cancel-email"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{user.email}</span>
                {user.emailVerified && (
                  <Lock className="h-4 w-4 text-gray-400" title="Email is locked after verification" />
                )}
              </div>
              
              {!user.emailVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700"
                  data-testid="button-edit-email"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {user.emailVerified ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Your email address has been verified and is now secure.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    Your email address is not verified. Verify it to secure your account and enable all features.
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={() => sendVerification.mutate()}
                  disabled={sendVerification.isPending}
                  size="sm"
                  className="w-full"
                  data-testid="button-send-verification"
                >
                  {sendVerification.isPending ? 'Sending...' : 'Send Verification Email'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
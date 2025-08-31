import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, UserPlus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createAdminSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .refine((val) => ["admin", "superadmin", "administrator"].includes(val.toLowerCase()), {
      message: "Username must be: admin, superadmin, or administrator"
    }),
  email: z.string()
    .email("Invalid email format")
    .refine((val) => {
      // Allow any email during validation, server will check authorization
      return true;
    }, "Invalid email format"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateAdminForm = z.infer<typeof createAdminSchema>;

export default function AdminSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  const form = useForm<CreateAdminForm>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check if admin already exists - ENHANCED SECURITY CHECK
  const checkAdminMutation = useMutation({
    mutationFn: () => 
      apiRequest("GET", "/api/admin/stats").then(() => true).catch(() => false),
    onSuccess: (exists) => {
      setAdminExists(exists);
      if (exists) {
        // Immediate redirect - no delay to prevent unauthorized access
        navigate("/admin/login");
      }
    },
    onError: () => {
      // If stats endpoint fails, try direct admin check
      apiRequest("POST", "/api/admin/auth/create-first", { test: true })
        .then(() => setAdminExists(false))
        .catch((error) => {
          if (error.message?.includes("Admin already exists")) {
            setAdminExists(true);
            navigate("/admin/login");
          }
        });
    },
  });

  useEffect(() => {
    checkAdminMutation.mutate();
  }, []);

  const createAdminMutation = useMutation({
    mutationFn: (data: Omit<CreateAdminForm, "confirmPassword">) => 
      apiRequest("POST", "/api/admin/auth/create-first", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Super admin account created successfully. You can now log in.",
      });
      navigate("/admin/login");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create admin account");
    },
  });

  const onSubmit = (data: CreateAdminForm) => {
    setError(null);
    const { confirmPassword, ...adminData } = data;
    createAdminMutation.mutate(adminData);
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Checking admin status...</p>
        </div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">Access Restricted</CardTitle>
            <CardDescription className="text-red-600">
              Admin account already exists. Only one super admin is allowed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Security Notice:</strong> This system allows only one administrator account for maximum security.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Please use the existing admin login.
            </p>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => navigate("/admin/login")}>
              Go to Admin Login
            </Button>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-xs text-muted-foreground w-full">
              If you've forgotten your credentials, contact your system administrator
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Setup</CardTitle>
          <CardDescription className="text-orange-600">
            <strong>RESTRICTED:</strong> Only authorized system owner can create admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter admin username" 
                        autoComplete="username"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="admin@example.com" 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter strong password"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? (
                  "Creating Admin Account..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Super Admin
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center">
          <div className="text-sm text-muted-foreground space-y-2 w-full">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>This account will have full administrative privileges</span>
            </div>
            <p>After creating this account, you'll need to log in</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
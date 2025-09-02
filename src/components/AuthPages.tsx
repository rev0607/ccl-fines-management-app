"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LogIn, User, EyeOff, View, MailCheck, LockKeyhole, RotateCcwKey } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type AuthView = "login" | "signup" | "forgot" | "reset";

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number and special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number and special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;
type ResetForm = z.infer<typeof resetSchema>;

interface AuthPagesProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthPages({ onLoginSuccess }: AuthPagesProps) {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: "text-muted-foreground"
  });
  
  const router = useRouter();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");

    if (/\d/.test(password)) score++;
    else feedback.push("One number");

    if (/[@$!%*?&]/.test(password)) score++;
    else feedback.push("One special character");

    let color = "text-destructive";
    if (score >= 4) color = "text-success";
    else if (score >= 3) color = "text-amber-500";

    return { score, feedback, color };
  };

  useEffect(() => {
    const password = signupForm.watch("password") || resetForm.watch("password");
    if (password) {
      setPasswordStrength(evaluatePasswordStrength(password));
    }
  }, [signupForm.watch("password"), resetForm.watch("password")]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { data: session, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL: "/"
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      if (session?.user) {
        // Store the bearer token for API calls
        const token = localStorage.getItem("better-auth.session_token") || session.token;
        if (token) {
          localStorage.setItem("bearer_token", token);
        }

        // Get user role from database to ensure proper role mapping
        try {
          const userResponse = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (userResponse.ok) {
            const users = await userResponse.json();
            const currentUser = users.find((u: any) => u.email === session.user.email);
            
            if (currentUser) {
              // Map better-auth user to app user format
              const mappedUser = {
                id: currentUser.id, // Use database user ID (number)
                name: session.user.name || currentUser.name,
                email: session.user.email,
                image: session.user.image,
                role: currentUser.role || "viewer"
              };
              
              toast.success("Welcome back!");
              onLoginSuccess(mappedUser);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }

        // Fallback if user lookup fails
        const fallbackUser = {
          id: parseInt(session.user.id) || Date.now(), // Convert string ID to number
          name: session.user.name || "User",
          email: session.user.email,
          image: session.user.image,
          role: "viewer" as const
        };
        
        toast.success("Welcome back!");
        onLoginSuccess(fallbackUser);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const { data: session, error } = await authClient.signUp.email({
        email: data.email,
        name: data.name,
        password: data.password
      });

      if (error?.code) {
        const errorMap = {
          USER_ALREADY_EXISTS: "Email already registered. Please try signing in instead."
        };
        toast.error(errorMap[error.code as keyof typeof errorMap] || "Registration failed");
        return;
      }

      toast.success("Account created successfully! You can now sign in.");
      // Switch to login view and pre-fill email
      resetAllForms();
      setCurrentView("login");
      loginForm.setValue("email", data.email);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onForgot = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      // Mock forgot password - in real app would call forgot password API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotSuccess(true);
      toast.success("If this email exists, a reset link has been sent.");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      // Mock reset password - in real app would call reset password API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Password reset successfully! Please sign in with your new password.");
      setCurrentView("login");
    } catch (error) {
      toast.error("Invalid or expired reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllForms = () => {
    loginForm.reset();
    signupForm.reset();
    forgotForm.reset();
    resetForm.reset();
    setForgotSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchView = (view: AuthView) => {
    resetAllForms();
    setCurrentView(view);
  };

  const renderPasswordStrengthIndicator = (password: string) => {
    if (!password) return null;

    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                level <= passwordStrength.score 
                  ? passwordStrength.score >= 4 
                    ? "bg-success" 
                    : passwordStrength.score >= 3 
                      ? "bg-amber-500" 
                      : "bg-destructive"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        {passwordStrength.feedback.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Missing: {passwordStrength.feedback.join(", ")}
          </div>
        )}
      </div>
    );
  };

  const getCardTitle = () => {
    switch (currentView) {
      case "login":
        return "Sign In";
      case "signup":
        return "Create Account";
      case "forgot":
        return "Reset Password";
      case "reset":
        return "Set New Password";
    }
  };

  const getCardDescription = () => {
    switch (currentView) {
      case "login":
        return "Enter your credentials to access your account";
      case "signup":
        return "Create a new account to get started";
      case "forgot":
        return "Enter your email to receive reset instructions";
      case "reset":
        return "Choose a strong password for your account";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            {currentView === "login" && <LogIn className="h-8 w-8 text-primary" />}
            {currentView === "signup" && <User className="h-8 w-8 text-primary" />}
            {currentView === "forgot" && <MailCheck className="h-8 w-8 text-primary" />}
            {currentView === "reset" && <LockKeyhole className="h-8 w-8 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-display">{getCardTitle()}</CardTitle>
          <CardDescription>{getCardDescription()}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentView === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="off"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <View className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchView("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              </form>
            </Form>
          )}

          {currentView === "signup" && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Enter your full name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            autoComplete="off"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <View className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {renderPasswordStrengthIndicator(field.value)}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            autoComplete="off"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <View className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </Form>
          )}

          {currentView === "forgot" && (
            <>
              {!forgotSuccess ? (
                <Form {...forgotForm}>
                  <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                    <FormField
                      control={forgotForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email address"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Alert>
                  <MailCheck className="h-4 w-4" />
                  <AlertDescription>
                    If this email exists in our system, a password reset link will be sent to it.
                    Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </>
          )}

          {currentView === "reset" && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a new password"
                            autoComplete="off"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <View className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {renderPasswordStrengthIndicator(field.value)}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            autoComplete="off"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <View className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
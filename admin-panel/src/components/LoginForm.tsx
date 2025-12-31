"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock, Mail, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      if (result?.needsVerification) {
        setNeedsVerification(true);
        setVerificationEmail(result.email);
        toast.info("Please verify your email to continue");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("admin")) {
          setError("You do not have admin privileges");
        } else if (err.message.includes("invalid-credential")) {
          setError("Invalid email or password");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to sign in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      // Sign in temporarily to resend verification
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        toast.success("Verification email sent!");
      }
      // Sign out after sending
      await auth.signOut();
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleBackToLogin = () => {
    setNeedsVerification(false);
    setVerificationEmail("");
    setPassword("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("user-not-found")) {
          toast.error("No account found with this email");
        } else {
          toast.error("Failed to send reset email");
        }
      }
    } finally {
      setIsResetting(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
  };

  return (
    <>
      {/* Email Verification Required Card */}
      {needsVerification ? (
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-linear-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
              <MailCheck className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
              <CardDescription className="text-gray-500">
                We sent a verification link to your email
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Check your inbox</p>
                    <p className="text-sm text-amber-700 mt-1">
                      We sent a verification link to <span className="font-medium">{verificationEmail}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">
                  Click the link in the email to verify your account, then come back and sign in.
                </p>
                
                <Button
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-12 bg-linear-to-r from-[#2AB09C] to-[#1a8a7a] hover:from-[#249588] hover:to-[#157a6c] text-white rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-center text-xs text-gray-400">
                  Didn&apos;t receive the email? Check your spam folder or try resending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Login Card */
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-linear-to-br from-[#2AB09C] to-[#1a8a7a] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">MindSets Admin</CardTitle>
            <CardDescription className="text-gray-500">
              Sign in to access the admin dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mindsets.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2AB09C] focus:ring-[#2AB09C] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-[#2AB09C] hover:text-[#1a8a7a] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2AB09C] focus:ring-[#2AB09C] transition-colors"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-linear-to-r from-[#2AB09C] to-[#1a8a7a] hover:from-[#249588] hover:to-[#157a6c] text-white rounded-xl text-base font-medium shadow-lg shadow-teal-200/50 transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Only authorized administrators can access this portal
            </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={closeForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resetSent ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Mail className="w-5 h-5 text-[#2AB09C]" />
              )}
              {resetSent ? "Email Sent!" : "Reset Password"}
            </DialogTitle>
            <DialogDescription>
              {resetSent
                ? "Check your inbox for the password reset link. It may take a few minutes to arrive."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </DialogDescription>
          </DialogHeader>

          {!resetSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@mindsets.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeForgotPassword}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#2AB09C] hover:bg-[#249588]"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4">
              <div className="flex flex-col items-center gap-4 p-6 bg-green-50 rounded-xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a reset link to <span className="font-medium">{resetEmail}</span>
                  </p>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button 
                  onClick={closeForgotPassword} 
                  className="w-full bg-[#2AB09C] hover:bg-[#249588]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

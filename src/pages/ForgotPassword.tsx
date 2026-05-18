import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, ArrowLeft, Mail, Users, CheckCircle, 
  KeyRound, ShieldCheck, Eye, EyeOff, Lock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "@/lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accountRole, setAccountRole] = useState("");
  
  // Reset phases
  const [step, setStep] = useState(1); // 1 = Request code, 2 = Verify & reset
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !accountRole) {
      toast({
        title: "Information Required",
        description: "Please select your role and enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      toast({
        title: "OTP Code Sent",
        description: response.msg || "Please check your inbox (or server console) for the 6-digit verification code.",
      });
      
      setStep(2); // Go to Step 2 (Reset form)
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Request Failed",
        description: err.message || "Something went wrong. Please check your email and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !newPassword || !confirmPassword) {
      toast({
        title: "All Fields Required",
        description: "Please provide the OTP code and enter both password fields.",
        variant: "destructive"
      });
      return;
    }

    if (code.trim().length !== 6) {
      toast({
        title: "Invalid Code",
        description: "The verification code must be exactly 6 digits.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Mismatch",
        description: "The passwords entered do not match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword
        }),
      });

      toast({
        title: "Password Reset Successful",
        description: response.msg || "You can now log in using your new credentials.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Reset Failed",
        description: err.message || "Invalid or expired verification code.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Container area */}
      <div className="mx-4 sm:mx-8 mt-2 rounded-3xl bg-secondary min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[450px] bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 md:p-10 transition-all duration-300">
          
          {step === 1 ? (
            /* STEP 1: Enter Email */
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Forgot Password?</h1>
                <p className="text-sm text-muted-foreground text-center">
                  No worries! Enter your email and select your role to receive a recovery code.
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-5">
                {/* Account Role */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Account Role
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={accountRole}
                      onChange={(e) => setAccountRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select your account type</option>
                      <option value="provider">Provider</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="e.g. sarah@fixhunger.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* STEP 2: Input code and new password */
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Verify Reset Code</h1>
                <p className="text-sm text-muted-foreground text-center">
                  We've sent a 6-digit OTP to <strong>{email}</strong>. Enter it below with your new password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-Digit OTP */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm font-semibold tracking-[0.25em] text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      required
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Must be at least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Verify your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-xs transition"
                  >
                    Change Email / Resend OTP
                  </button>
                </div>
              </>
            )}

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-5 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

          {/* Footer inside green area */}
          <p className="text-center mt-8 text-xs text-muted-foreground">
            © 2024 FixHunger AI-Powered Logistics. All rights reserved.<br />
            Humanitarian Technology for Global Food Security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

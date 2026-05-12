import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, HandHeart, ArrowRight, CheckCircle, Zap, Mail, Lock, User, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

type Role = "provider" | "ngo" | null;

const Signup = () => {
  const navigate = useNavigate();
  const { signup, resendVerification } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!role) { setError("Please select a role"); return; }
    if (!fullName.trim()) { setError("Please enter your full name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreeTerms) { setError("Please agree to the terms"); return; }

    setLoading(true);
    try {
      await signup(email, password, fullName, role === "provider" ? "Provider" : "NGO");
      setVerificationSent(true);
      toast({ title: "Account Created!", description: "A verification link has been sent to your email." });
    } catch (err: any) {
      console.error("Signup error:", err);
      let msg = "Signup failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please go to the Login page.";
      } else if (err.code === "auth/invalid-email") {
        msg = "The email address is invalid.";
      } else if (err.code === "auth/weak-password") {
        msg = "The password is too weak.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(email);
      toast({ title: "Verification Resent!", description: "Check your inbox for the new link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center px-4 py-6 sm:py-16">
          <div className="w-full max-w-[480px] bg-card rounded-2xl shadow-lg p-8 sm:p-10 text-center border border-border">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We've sent a verification link to <strong className="text-foreground">{email}</strong>. 
              Please check your inbox and click the link to activate your account.
            </p>
            
            <div className="bg-secondary rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" /> Check your inbox (and spam folder)
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" /> Click the verification link
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" /> Come back and login
              </div>
            </div>

            <button onClick={handleResend}
              className="w-full py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition mb-3">
              <Mail className="w-4 h-4" /> Resend Verification Email
            </button>

            <Link to="/login"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md">
              Go to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center px-4 py-6 sm:py-10">
        <div className="flex w-full max-w-[680px] rounded-2xl overflow-hidden shadow-lg flex-col md:flex-row">
          {/* Left panel */}
          <div className="hidden md:flex flex-col justify-between w-[240px] bg-secondary p-8 rounded-l-2xl">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight mb-3">
                Join the food rescue movement.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every registration helps bridge the gap between food surplus and those in need in our urban communities.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Verified Partners</p>
                  <p className="text-xs text-muted-foreground">Over 500+ NGOs onboarded</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Real-time Logistics</p>
                  <p className="text-xs text-muted-foreground">AI-powered routing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Form */}
          <div className="flex-1 bg-card p-6 sm:p-8 md:p-10">
            <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-6">Start your journey with FixHunger today.</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selection */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRole("provider")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === "provider" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <Building2 className={`w-6 h-6 mb-1 ${role === "provider" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-semibold uppercase ${role === "provider" ? "text-primary" : "text-muted-foreground"}`}>Provider</span>
                  </button>
                  <button type="button" onClick={() => setRole("ngo")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === "ngo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <HandHeart className={`w-6 h-6 mb-1 ${role === "ngo" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-semibold uppercase ${role === "ngo" ? "text-primary" : "text-muted-foreground"}`}>NGO</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Name</label>
                <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email Address</label>
                <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Confirm</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-muted-foreground">
                  I agree to the <span className="text-primary font-medium">Terms of Service</span> and <span className="text-primary font-medium">Privacy Policy</span>.
                </span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-foreground font-semibold underline">Login here</Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-muted-foreground space-y-2">
        <p>© 2024 FixHunger Logistics System. All rights reserved.</p>
        <div className="flex justify-center gap-4">
          <span className="uppercase tracking-wide cursor-pointer hover:text-foreground transition">Privacy</span>
          <span>•</span>
          <span className="uppercase tracking-wide cursor-pointer hover:text-foreground transition">Terms</span>
          <span>•</span>
          <span className="uppercase tracking-wide cursor-pointer hover:text-foreground transition">Support</span>
        </div>
      </footer>
    </div>
  );
};

export default Signup;

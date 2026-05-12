import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, HandHeart, LogIn, Mail, Lock, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Role = "provider" | "ngo" | null;

const ADMIN_EMAIL = "adminfixhunger@gmail.com";
const ADMIN_PASS = "fixhunger@123";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) { setError("Please select a role"); return; }
    if (!email || !password) { setError("Please enter email and password"); return; }

    setLoading(true);
    setError("");
    try {
      const result = await login(email, password);
      
      if (!result.emailVerified) {
        setError("Please verify your email first. Check your inbox for the verification link.");
        setLoading(false);
        return;
      }

      toast({ title: "Welcome back!", description: "Login successful." });
      if (result.role === "Admin") {
        navigate("/admin/dashboard");
      } else if (result.role === "Provider") {
        navigate("/provider/dashboard");
      } else if (result.role === "NGO") {
        navigate("/ngo/dashboard");
      } else if (role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/ngo/dashboard");
      }

    } catch (err: any) {
      const msg = err.code === "auth/user-not-found"
        ? "No account found with this email."
        : err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
        ? "Invalid email or password."
        : err.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      setLoading(true);
      setError("");
      try {
        await login(email, password);
        toast({ title: "Admin Access Granted", description: "Welcome to the command center." });
        navigate("/admin/dashboard");
      } catch (err: any) {
        setError(err.message || "Admin login failed on server.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-4 sm:mx-8 mt-2 rounded-3xl bg-secondary min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[480px] bg-card rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Urban Food Rescue & Logistics System</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="name@organization.org" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" 
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole("provider")}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${role === "provider" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <Building2 className={`w-6 h-6 mb-1.5 ${role === "provider" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold uppercase ${role === "provider" ? "text-primary" : "text-muted-foreground"}`}>Provider</span>
                </button>
                <button type="button" onClick={() => setRole("ngo")}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${role === "ngo" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <HandHeart className={`w-6 h-6 mb-1.5 ${role === "ngo" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold uppercase ${role === "ngo" ? "text-primary" : "text-muted-foreground"}`}>NGO</span>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition mt-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign in to Dashboard <LogIn className="w-4 h-4" /></>}
            </button>

            <button type="button" onClick={handleAdminLogin}
              className="w-full py-3 rounded-xl border-2 border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition">
              <Shield className="w-4 h-4" /> Admin Login
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">Create an account</Link>
          </p>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-[10px] text-muted-foreground uppercase tracking-wide">
            <span>Secure SSL Encryption</span>
            <div className="flex gap-3">
              <span>Privacy</span>
              <span>Terms</span>
              <span>V2.4.1</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        <p>© 2024 FixHunger Global. All rights reserved. Humanitarian Technology Initiative.</p>
      </footer>
    </div>
  );
};

export default Login;

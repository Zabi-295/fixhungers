import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, CheckCircle, ShieldAlert, Eye, EyeOff, Lock, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Parse recovery details from URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If someone hits this route directly without valid params
    if (!token || !email) {
      toast({
        title: "Access Denied",
        description: "This password recovery link is malformed or invalid.",
        variant: "destructive"
      });
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      toast({
        title: "Invalid Credentials",
        description: "Recovery token or email is missing from URL.",
        variant: "destructive"
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Required Fields",
        description: "Please fill in both password fields.",
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
          email: decodeURIComponent(email),
          token,
          newPassword
        }),
      });

      toast({
        title: "Password Updated",
        description: response.msg || "Your new password is now active.",
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Reset Failed",
        description: err.message || "This reset link has expired or is invalid.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = !token || !email;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Container area */}
      <div className="mx-4 sm:mx-8 mt-2 rounded-3xl bg-secondary min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[450px] bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 md:p-10 transition-all duration-300">
          
          {isInvalid ? (
            /* ERROR STATE */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">Invalid Link</h1>
              <p className="text-sm text-muted-foreground max-w-[340px] mb-6 leading-relaxed">
                This password reset link is invalid, broken, or has expired. Please request a new recovery link.
              </p>
              <Link
                to="/forgot-password"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center hover:opacity-90 transition"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
            /* SUCCESS STATE */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">Password Secured!</h1>
              <p className="text-sm text-muted-foreground max-w-[340px] leading-relaxed">
                Your new password has been successfully saved. You are being redirected to the login portal...
              </p>
            </div>
          ) : (
            /* RESET PASSWORD FORM */
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Set New Password</h1>
                <p className="text-sm text-muted-foreground text-center">
                  Update the password for account:<br />
                  <strong className="text-foreground">{decodeURIComponent(email!)}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Reset button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Saving Password..." : "Update Password"}
                  <CheckCircle className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {!success && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          )}
        </div>

        {/* Footer inside green area */}
        <p className="text-center mt-8 text-xs text-muted-foreground">
          © 2024 FixHunger AI-Powered Logistics. All rights reserved.<br />
          Humanitarian Technology for Global Food Security.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;

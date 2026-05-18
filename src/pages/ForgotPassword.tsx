import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Users, KeyRound, MailCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "@/lib/api";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accountRole, setAccountRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        title: "Link Sent Successfully",
        description: response.msg || "A secure reset link has been dispatched.",
      });
      
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Request Failed",
        description: err.message || "Failed to dispatch recovery link.",
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
          
          {!submitted ? (
            /* Request Form */
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Forgot Password?</h1>
                <p className="text-sm text-muted-foreground text-center">
                  No worries! Enter your email and select your role to receive a recovery link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  {loading ? "Sending link..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            /* Success Feedback card */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <MailCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">Check Your Email</h1>
              <p className="text-sm text-muted-foreground max-w-[340px] mb-6 leading-relaxed">
                A secure password reset link has been dispatched to <strong className="text-foreground">{email}</strong>. 
                Please check your inbox (and spam folder) to reset your password.
              </p>
              <div className="p-3.5 bg-muted rounded-xl text-xs text-muted-foreground w-full mb-2">
                <strong>Development Note:</strong> If standard SMTP is not configured in <code className="text-primary bg-primary/5 px-1 py-0.5 rounded">server/.env</code>, the mock reset link is printed inside the backend terminal logs!
              </div>
            </div>
          )}

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition"
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
  );
};

export default ForgotPassword;

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Mail, Users, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [accountRole, setAccountRole] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Green gradient area */}
      <div className="mx-4 sm:mx-8 mt-2 rounded-3xl bg-secondary min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] bg-card rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
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

            {/* Email */}
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
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

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
  );
};

export default ForgotPassword;

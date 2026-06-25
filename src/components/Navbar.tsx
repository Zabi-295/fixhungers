import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">Fix Hunger</span>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isLoginPage ? (
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Join Network
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 rounded-full border border-primary text-primary font-medium text-sm hover:bg-primary hover:text-primary-foreground transition"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import ProviderLayout from "./components/ProviderLayout";
import ProviderDashboard from "./pages/provider/Dashboard";
import DonateFood from "./pages/provider/DonateFood";
import DonationHistory from "./pages/provider/DonationHistory";
import ProviderSettings from "./pages/provider/ProviderSettings";
import NGOLayout from "./components/NGOLayout";
import NGODashboard from "./pages/ngo/Dashboard";
import NearbyDonations from "./pages/ngo/NearbyDonations";
import NGOHistory from "./pages/ngo/History";
import NGOProfile from "./pages/ngo/Profile";
import DonationDetail from "./pages/ngo/DonationDetail";
import RescueAssistant from "./pages/ngo/RescueAssistant";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import DonationMonitoring from "./pages/admin/DonationMonitoring";
import Analytics from "./pages/admin/Analytics";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import { DonationProvider } from "./context/DonationContext";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider } from "./context/AuthContext";

import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fix-hunger-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <DonationProvider>
          <AdminProvider>
            <Routes>
              <Route path="/" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              {/* Provider */}
              <Route path="/provider/dashboard" element={<ProviderLayout><ProviderDashboard /></ProviderLayout>} />
              <Route path="/provider/donate" element={<ProviderLayout><DonateFood /></ProviderLayout>} />
              <Route path="/provider/history" element={<ProviderLayout><DonationHistory /></ProviderLayout>} />
              <Route path="/provider/settings" element={<ProviderLayout><ProviderSettings /></ProviderLayout>} />
              {/* NGO */}
              <Route path="/ngo/dashboard" element={<NGOLayout><NGODashboard /></NGOLayout>} />
              <Route path="/ngo/nearby" element={<NGOLayout><NearbyDonations /></NGOLayout>} />
              <Route path="/ngo/history" element={<NGOLayout><NGOHistory /></NGOLayout>} />
              <Route path="/ngo/profile" element={<NGOLayout><NGOProfile /></NGOLayout>} />
              <Route path="/ngo/donation/:id" element={<NGOLayout><DonationDetail /></NGOLayout>} />
              <Route path="/ngo/assistant" element={<NGOLayout><RescueAssistant /></NGOLayout>} />
              {/* Admin */}
              <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
              <Route path="/admin/donations" element={<AdminLayout><DonationMonitoring /></AdminLayout>} />
              <Route path="/admin/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />
              <Route path="/admin/profile" element={<AdminLayout><AdminProfile /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdminProvider>
        </DonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Heart, Shield, ArrowRight, Star, Award, Sparkles, MapPin, 
  Utensils, Users, Building, CheckCircle, TrendingUp, HandHeart
} from "lucide-react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface Stats {
  completedRescues: number;
  totalDonations: number;
  activeNGOs: number;
  activeProviders: number;
}

interface TopNGO {
  _id: string;
  name: string;
  rating: number;
  reviewCount: number;
  rank: number;
  profile?: {
    location?: string;
    vehicleType?: string;
  };
}

interface TopProvider {
  _id: string;
  name: string;
  profile?: {
    orgType?: string;
    address?: string;
  };
}

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    completedRescues: 124,
    totalDonations: 158,
    activeNGOs: 12,
    activeProviders: 18
  });
  const [topNGOs, setTopNGOs] = useState<TopNGO[]>([]);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const getApiUrl = () => {
          if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
          if (import.meta.env.PROD) return "/api";
          return "http://localhost:5000/api";
        };
        const response = await fetch(`${getApiUrl()}/public/landing`);
        if (response.ok) {
          const data = await response.json();
          if (data.stats) setStats(data.stats);
          if (data.topNGOs) setTopNGOs(data.topNGOs);
          if (data.topProviders) setTopProviders(data.topProviders);
        }
      } catch (err) {
        console.error("Failed to load landing statistics:", err);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/75 border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-primary transition-colors">Stats & Impact</a>
            <a href="#leaderboard" className="hover:text-primary transition-colors">Impact Leaders</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              to="/login" 
              className="text-sm font-bold px-4 py-2 rounded-xl text-foreground hover:bg-muted transition"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="text-sm font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition shadow-sm"
            >
              Join Us
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Direct Community Food Redistribution
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight sm:leading-none">
            Minimize Food Waste,<br />
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Feed Families in Need
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connecting local restaurants and food providers with verified NGOs to rescue surplus meals and deliver them safely to underprivileged families.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-bold px-8 py-4 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 transition shadow-lg hover:shadow-primary/20 group"
            >
              Start Donating Food <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/signup" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-bold px-8 py-4 rounded-2xl bg-card border border-border text-foreground hover:bg-muted transition shadow-sm"
            >
              <HandHeart className="w-5 h-5 text-primary" /> Register as NGO
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section id="stats" className="py-16 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="bg-card/45 backdrop-blur-sm border border-border/85 rounded-3xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform shadow-sm hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-3xl font-black tracking-tight text-foreground">
                  {stats.completedRescues}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Completed Rescues</div>
              </div>
            </div>

            <div className="bg-card/45 backdrop-blur-sm border border-border/85 rounded-3xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform shadow-sm hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Utensils className="w-7 h-7" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-3xl font-black tracking-tight text-foreground">
                  {stats.totalDonations}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Meals Shared</div>
              </div>
            </div>

            <div className="bg-card/45 backdrop-blur-sm border border-border/85 rounded-3xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform shadow-sm hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-3xl font-black tracking-tight text-foreground">
                  {stats.activeNGOs}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Partner NGOs</div>
              </div>
            </div>

            <div className="bg-card/45 backdrop-blur-sm border border-border/85 rounded-3xl p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform shadow-sm hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Building className="w-7 h-7" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="text-3xl font-black tracking-tight text-foreground">
                  {stats.activeProviders}
                </div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Food Providers</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">How FixHunger Works</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            A simple, verified, and automated logistics chain designed to secure surplus food within minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary">
              1
            </div>
            <h3 className="text-lg font-bold text-foreground">Provider Logs Food</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Food providers (restaurants, hotels, events) list surplus food. They can scan items with our Gemini AI for category validation and shelf life estimations.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary">
              2
            </div>
            <h3 className="text-lg font-bold text-foreground">NGO Receives Alerts</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Verified local NGOs within the provider's region immediately receive real-time dashboard updates and push notifications to claim the food.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl space-y-4 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary">
              3
            </div>
            <h3 className="text-lg font-bold text-foreground">Safe Distribution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              NGO rescuers claim the donation, navigate with live Leaflet maps to coordinates, pick up the package, and distribute it to local families.
            </p>
          </div>

        </div>
      </section>

      {/* 5. Leaders Section (NGO & Providers Leaderboard) */}
      <section id="leaderboard" className="py-20 bg-secondary/10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
              <Award className="w-8 h-8 text-primary" /> Top Impact Leaders
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Meet our top-performing NGOs and active food partners driving real change in local neighborhoods.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Top NGOs */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Top Verified NGOs
              </h3>
              
              <div className="space-y-4">
                {topNGOs.length === 0 ? (
                  // Demo data if none registered with ratings yet
                  [
                    { name: "Edhi Food Rescue", rating: 5.0, reviews: 24, rank: 1, loc: "Karachi, Pakistan" },
                    { name: "Saylani Food Trust", rating: 4.9, reviews: 18, rank: 2, loc: "Lahore, Pakistan" },
                    { name: "Al-Khidmat Foundation", rating: 4.8, reviews: 15, rank: 3, loc: "Sahiwal, Pakistan" }
                  ].map((ngo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          #{ngo.rank}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{ngo.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ngo.loc}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1 justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {ngo.rating}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">{ngo.reviews} reviews</p>
                      </div>
                    </div>
                  ))
                ) : (
                  topNGOs.map((ngo) => (
                    <div key={ngo._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          #{ngo.rank || 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{ngo.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ngo.profile?.location || "Pakistan"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1 justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {ngo.rating?.toFixed(1) || "5.0"}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">{ngo.reviewCount || 0} reviews</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Providers */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Top Food Providers
              </h3>
              
              <div className="space-y-4">
                {topProviders.length === 0 ? (
                  // Demo data if none registered yet
                  [
                    { name: "Monarch Marriott Banquet", type: "Hotel / Catering", loc: "Lahore, Pakistan" },
                    { name: "Savour Foods", type: "Restaurant", loc: "Islamabad, Pakistan" },
                    { name: "Gourmet Bakers & Sweets", type: "Bakery Chain", loc: "Lahore, Pakistan" }
                  ].map((prov, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{prov.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {prov.loc}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0">
                        {prov.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  topProviders.map((prov) => (
                    <div key={prov._id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{prov.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {prov.profile?.address || "Pakistan"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0">
                        {prov.profile?.orgType || "Food Provider"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Footer Section */}
      <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Branding Column */}
            <div className="space-y-4 col-span-1 md:col-span-2 text-left">
              <div className="flex items-center gap-2">
                <Logo size="md" iconOnly />
                <span className="font-extrabold text-xl tracking-tight text-foreground">Fix Hunger</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                A community-driven digital bridge connecting restaurants and food retailers directly with verified charity distribution organizations.
              </p>
            </div>

            {/* Navigation Column */}
            <div className="space-y-3 text-left">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Platform</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
                <a href="#stats" className="hover:text-primary transition-colors">Impact Stats</a>
                <a href="#leaderboard" className="hover:text-primary transition-colors">Leaderboards</a>
              </div>
            </div>

            {/* Account CTAs Column */}
            <div className="space-y-3 text-left">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Get Involved</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/signup" className="hover:text-primary transition-colors">Register Business</Link>
                <Link to="/signup" className="hover:text-primary transition-colors">NGO Partnership</Link>
                <Link to="/login" className="hover:text-primary transition-colors">Secure Sign In</Link>
              </div>
            </div>

          </div>

          <div className="border-t border-border/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
            <p>© 2026 Fix Hunger Platform. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;

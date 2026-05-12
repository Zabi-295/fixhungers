import { Camera, Image, Plus, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { useDonations } from "@/context/DonationContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const categories = ["Produce", "Bakery", "Dairy", "Prepared Meals", "Meat", "Beverages", "Grains", "Other"];
const units = ["kg", "Units", "Liters", "Loaves", "Boxes", "Packets"];

const DonateFood = () => {
  const { addDonation } = useDonations();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [expiryHours, setExpiryHours] = useState("");
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetected, setAiDetected] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const analyzeFood = async (base64Image: string) => {
    console.log("analyzeFood called via Supabase, base64 length:", base64Image.length);
    setIsAnalyzing(true);
    setAiDetected(false);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64: base64Image },
      });

      if (error) throw error;


      if (data?.name) {
        setName(data.name);
        setAiDetected(true);
      }
      if (data?.category && categories.includes(data.category)) {
        setCategory(data.category);
      }
      if (data?.shelfLifeHours) {
        setExpiryHours(String(data.shelfLifeHours));
      }

      toast({
        title: "🤖 AI Food Detection",
        description: `Detected: ${data?.name || "Unknown"} — ${data?.category || ""} — ~${data?.shelfLifeHours || "?"}h shelf life`,
      });
    } catch (err: any) {
      console.error("AI analysis failed:", err);
      setAiError(err.message);
      toast({
        title: "AI Analysis Failed",
        description: err.message || "Could not recognize food. Please fill details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.size, file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Foran preview dikhao taake display pe aa jaye
        setImagePreview(base64);
        
        // Background mein resizing aur scanning karein
        const img = new Image();
        img.onload = () => {
          console.log("Image loaded for processing, original size:", img.width, "x", img.height);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1000;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const processedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            console.log("Image resized, sending to AI...");
            analyzeFood(processedBase64);
          } else {
            analyzeFood(base64);
          }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };




  const handleSubmit = async () => {
    if (!name.trim() || !category || !quantity.trim() || !expiryHours.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in Item Name, Category, Quantity, and Shelf Life.", variant: "destructive" });
      return;
    }

    try {
      await addDonation({
        name: name.trim(),
        category,
        quantity: quantity.trim(),
        unit,
        expiryDate: new Date(Date.now() + Number(expiryHours) * 60 * 60 * 1000).toISOString(),
        notes: notes.trim(),
        emoji: "",
        image: imagePreview || undefined,
      });

      toast({ title: "Donation Added! 🎉", description: `${name} has been listed successfully.` });
      setName(""); setCategory(""); setQuantity(""); setUnit("kg"); setExpiryHours(""); setNotes(""); setImagePreview(null); setAiDetected(false);
      navigate("/provider/dashboard");
    } catch {
      toast({ title: "Save Failed", description: "Donation could not be saved. Please try again.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setName(""); setCategory(""); setQuantity(""); setUnit("kg"); setExpiryHours(""); setNotes(""); setImagePreview(null); setAiDetected(false);
  };

  if (userProfile && userProfile.status === false) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Account Inactive</h2>
          <p className="text-muted-foreground text-sm max-w-sm">Your account has been deactivated by the admin. You cannot add new food donations at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Donate Food</h1>
          <p className="text-muted-foreground text-sm">Upload a photo — AI will recognize the food automatically!</p>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-5">
          <Camera className="w-5 h-5 text-primary" /> Upload Food Photo
          {isAnalyzing && (
            <Badge variant="secondary" className="ml-2 animate-pulse gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> AI Analyzing...
            </Badge>
          )}
          {aiDetected && !isAnalyzing && (
            <Badge className="ml-2 gap-1 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3" /> AI Detected
            </Badge>
          )}
        </h2>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative inline-block overflow-hidden rounded-xl border border-border">
              <img src={imagePreview} alt="Food preview" className="w-full max-w-sm h-48 object-cover" />
              <button 
                onClick={() => { setImagePreview(null); setAiDetected(false); setAiError(null); }} 
                className="absolute top-2 right-2 w-7 h-7 bg-card/80 backdrop-blur rounded-full flex items-center justify-center border border-border z-10"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center transition-all">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <Sparkles className="w-4 h-4 text-primary absolute top-0 right-0 animate-pulse" />
                    </div>
                    <span className="text-sm font-bold text-primary animate-pulse tracking-wide">AI SCANNING...</span>
                  </div>
                </div>
              )}
            </div>

            {aiError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2 max-w-sm">
                <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-destructive">AI Analysis Failed</p>
                  <p className="text-[10px] text-destructive/80 leading-tight">{aiError}</p>
                </div>
              </div>
            )}
          </div>
        ) : (

          <div
            className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-10 px-4 transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-center text-sm mb-1">AI Food Recognition</p>
            <p className="text-xs text-muted-foreground text-center max-w-[250px] mb-6">Take a photo or upload an image, AI will detect everything!</p>
            
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-xs">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 gap-2 h-10" 
                onClick={() => {
                  // Mobile pe ye camera ka prompt dega aur PC pe file selector
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4" /> Take Photo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2 h-10" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4" /> Gallery
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Food Details Form */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Food Item Details
          {aiDetected && <span className="text-xs text-muted-foreground font-normal">(Auto-filled by AI — you can edit)</span>}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Item Name * {aiDetected && <Sparkles className="w-3 h-3 inline text-primary" />}</Label>
            <Input placeholder="e.g. Chicken Biryani" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category * {aiDetected && <Sparkles className="w-3 h-3 inline text-primary" />}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantity *</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="e.g. 50" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="flex-1" />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Shelf Life (Hours) * {aiDetected && <Sparkles className="w-3 h-3 inline text-primary" />}</Label>
            <div className="relative">
              <Input type="number" placeholder="e.g. 6" value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hours</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Additional Notes</Label>
          <Textarea placeholder="Any special instructions, storage requirements, etc." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        {/* Preview */}
        {name && (
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Preview</span>
            <div className="flex gap-3 items-center">
              {imagePreview && <img src={imagePreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />}
              <div>
                <p className="font-semibold text-foreground text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {category && `${category} • `}{quantity && `${quantity} ${unit}`}{expiryHours && ` • Shelf Life: ${expiryHours}h`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="lg" onClick={handleReset}>Reset</Button>
          <Button size="lg" className="bg-primary text-primary-foreground px-8" onClick={handleSubmit} disabled={isAnalyzing}>
            <Plus className="w-4 h-4 mr-1" /> Add Donation
          </Button>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">AI-Powered Food Detection</p>
          <p className="text-xs text-primary">Upload a photo and our AI will automatically identify the food, its category, and estimated shelf life. You only need to add the quantity!</p>
        </div>
      </div>
    </div>
  );
};

export default DonateFood;

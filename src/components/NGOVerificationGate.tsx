import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import apiFetch from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { FileText, Image, ShieldAlert, CheckCircle2, Loader2, UploadCloud, AlertCircle } from "lucide-react";

const NGOVerificationGate = () => {
  const { currentUser, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  
  const [ngoCertificate, setNgoCertificate] = useState<string | null>(null);
  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);

  const [ngoFileName, setNgoFileName] = useState("");
  const [cfFileName, setCfFileName] = useState("");
  const [cbFileName, setCbFileName] = useState("");

  const [loading, setLoading] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setBase64: (val: string) => void,
    setFileName: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max file size is 8MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64Str = await fileToBase64(file);
      setBase64(base64Str);
      setFileName(file.name);
    } catch (err) {
      toast({
        title: "Error loading file",
        description: "Please try another file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoCertificate || !cnicFront || !cnicBack) {
      toast({
        title: "Missing Documents",
        description: "Please upload all three required documents.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/ngo-verify", {
        method: "POST",
        body: JSON.stringify({
          ngoCertificate,
          cnicFront,
          cnicBack,
        }),
      });
      
      toast({
        title: "Documents Submitted",
        description: "Your NGO verification request is now pending admin approval.",
      });

      await refreshUser();
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const status = currentUser?.verificationStatus || "unsubmitted";

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-xl mx-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-background p-1.5 rounded-full border border-border">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Verification Under Review</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Thank you for submitting your verification details. Our administrators are currently reviewing your NGO registration certificate and CNIC details. This process usually takes 24-48 hours. You will receive an automated email notification once approved.
        </p>
        <div className="bg-card border border-border p-4 rounded-xl w-full text-left space-y-2 mb-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted Status</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">NGO Registration Certificate</span>
            <span className="text-primary font-medium">✓ Uploaded</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Owner CNIC (Front & Back)</span>
            <span className="text-primary font-medium">✓ Uploaded</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-6 py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors"
        >
          Logout Securely
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">NGO Verification Required</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          To maintain platform safety, NGO accounts must submit identification documents before performing any actions or accepting food donations.
        </p>
      </div>

      {status === "rejected" && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-5 mb-8 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Verification Attempt Rejected</h4>
            <p className="text-xs mt-1 text-destructive/90 leading-relaxed">
              Reason: {currentUser?.verificationDocs?.rejectionReason || "Uploaded documents were invalid or blurry."}
            </p>
            <p className="text-xs mt-2 font-medium">Please re-upload correct documents below for re-evaluation.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NGO Certificate */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">NGO Registration Certificate</h3>
              <p className="text-xs text-muted-foreground">Upload your government-issued NGO license or registration proof.</p>
            </div>
          </div>

          <label className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20">
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
            <span className="text-xs font-semibold text-foreground">
              {ngoFileName || "Choose document file or drag & drop"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG (Max 8MB)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleFileChange(e, setNgoCertificate, setNgoFileName)}
            />
          </label>
        </div>

        {/* CNIC Front */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">CNIC Front Side</h3>
                  <p className="text-xs text-muted-foreground">National Identity Card Front Image.</p>
                </div>
              </div>

              <label className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-center text-foreground truncate max-w-full">
                  {cfFileName || "Upload Front Side"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setCnicFront, setCfFileName)}
                />
              </label>
            </div>
          </div>

          {/* CNIC Back */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">CNIC Back Side</h3>
                  <p className="text-xs text-muted-foreground">National Identity Card Back Image.</p>
                </div>
              </div>

              <label className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-center text-foreground truncate max-w-full">
                  {cbFileName || "Upload Back Side"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setCnicBack, setCbFileName)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !ngoCertificate || !cnicFront || !cnicBack}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Documents...
              </>
            ) : (
              "Submit Documents for Verification"
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-6 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-xl text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
};

export default NGOVerificationGate;

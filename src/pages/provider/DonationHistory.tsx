import { ClipboardList, Truck, Heart, TrendingUp, Search, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { useNavigate } from "react-router-dom";
import { formatDonationShortDate } from "@/lib/donation-utils";
import apiFetch from "@/lib/api";
import { toast } from "@/hooks/use-toast";


const tabs = ["All Donations", "Pending", "Completed"];

const DonationHistory = () => {
  const { providerDonations, deleteDonation } = useDonations();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const donations = providerDonations;

  const filtered = donations.filter((d) => {
    const matchTab = activeTab === 0 || (activeTab === 1 && d.status === "Pending") || (activeTab === 2 && (d.status === "Completed" || d.status === "Collected"));
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const pendingCount = donations.filter((d) => d.status === "Pending").length;
  const completedCount = donations.filter((d) => d.status === "Completed" || d.status === "Collected").length;
  const tabCounts = [donations.length, pendingCount, completedCount];

  const stats = [
    { label: "TOTAL RESCUED", value: donations.length.toLocaleString(), change: `${donations.length} items`, icon: ClipboardList },
    { label: "PENDING PICKUPS", value: pendingCount.toString(), change: "Active", icon: Truck },
    { label: "COMPLETED", value: completedCount.toString(), change: "Done", icon: Heart },
  ];

  const handleExport = () => {
    const csv = ["Name,Category,Quantity,Expiry,Status,Date Added", ...donations.map((d) => `${d.name},${d.category},${d.quantity},${d.expiryDate},${d.status},${new Date(d.createdAt).toLocaleDateString()}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "donations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { fetchDonations } = useDonations();
  const [hoverRating, setHoverRating] = useState(0);

  const submitReview = async () => {
    if (!selectedDonation) return;
    setSubmitting(true);
    try {
      await apiFetch(`/donations/${selectedDonation.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment })
      });
      toast({ title: "Review Submitted!", description: "Thank you for your feedback. NGO ranking updated." });
      await fetchDonations();
      setSelectedDonation(null);
      setRating(5);
      setComment("");
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Donation History</h1>
          <p className="text-muted-foreground text-sm">Detailed overview of all your contributions.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
          <Button className="bg-primary text-primary-foreground gap-2 flex-1 sm:flex-none" onClick={() => navigate("/provider/donate")}><Plus className="w-4 h-4" /> Donate</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><s.icon className="w-4 h-4" /></div>
              <span className="text-xs uppercase font-semibold text-primary tracking-wide">{s.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-primary font-medium flex items-center gap-0.5 mb-1"><TrendingUp className="w-3 h-3" /> {s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 pb-0 gap-3">
          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
            {tabs.map((tab, i) => (
              <button key={tab} onClick={() => { setActiveTab(i); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === i ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {tab}
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">{tabCounts[i]}</Badge>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <p>{search ? "No items match your search." : "No donations found."}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-primary font-semibold">Item Name</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden md:table-cell">Date Added</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold">Quantity</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden lg:table-cell">Accepted By</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {d.image ? <img src={d.image} alt={d.name} className="w-8 h-8 rounded-lg object-cover border border-border" /> : <span className="text-2xl">{d.emoji}</span>}
                      <span className="font-medium text-foreground">{d.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-primary text-sm hidden sm:table-cell">{d.category}</TableCell>
                  <TableCell className="text-foreground hidden md:table-cell">{formatDonationShortDate(d.createdAt)}</TableCell>
                  <TableCell className="font-semibold text-foreground">{d.quantity}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">
                    {d.acceptedBy ? (
                      <span className="text-primary font-medium">{d.acceptedBy}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${d.status === "Completed" || d.status === "Collected" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {d.status === "Completed" || d.status === "Collected" ? "✓" : "⏳"} {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                       {(d.status === "Completed" || d.status === "Collected") && !d.review && (
                        <Button 
                          size="sm" 
                          className="h-8 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                          onClick={() => setSelectedDonation(d)}
                        >
                          ⭐ Rate NGO
                        </Button>
                      )}
                      {d.review && (
                        <div className="flex items-center gap-1 text-primary">
                          <span className="text-xs font-bold">{d.review.rating}</span>
                          <span className="text-[10px]">⭐</span>
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteDonation(d.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 pt-3 text-sm gap-2">
            <span className="text-primary text-xs sm:text-sm">Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <Button key={i + 1} variant={page === i + 1 ? "default" : "outline"} size="sm" onClick={() => setPage(i + 1)}
                  className={page === i + 1 ? "bg-primary text-primary-foreground" : ""}>{i + 1}</Button>
              ))}
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-foreground mb-1">Rate {selectedDonation.acceptedBy}</h2>
            <p className="text-sm text-muted-foreground mb-6">Your feedback helps us rank NGOs and ensure quality rescues.</p>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Your Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl transition-transform hover:scale-125 active:scale-95"
                    >
                      <span className={ (hoverRating || rating) >= star ? "text-primary" : "text-muted opacity-40" }>★</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {rating === 5 ? "Excellent!" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-primary">Review Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the pickup experience..."
                  className="w-full h-24 p-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl"
                  onClick={() => setSelectedDonation(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl bg-primary text-primary-foreground"
                  onClick={submitReview}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistory;


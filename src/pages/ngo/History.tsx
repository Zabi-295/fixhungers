import { useState } from "react";
import { useDonations } from "@/context/DonationContext";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDonationShortDate } from "@/lib/donation-utils";

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Accepted: "bg-blue-100 text-blue-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Collected: "bg-primary/10 text-primary",
  Completed: "bg-primary/10 text-primary",
};

const History = () => {
  const { ngoAcceptedDonations } = useDonations();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "completed" | "active">("all");

  const myDonations = ngoAcceptedDonations;
  const filtered = myDonations.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    if (tab === "completed") return matchSearch && (d.status === "Completed" || d.status === "Collected");
    if (tab === "active") return matchSearch && (d.status === "Accepted" || d.status === "In Transit");
    return matchSearch;
  });

  const handleExport = () => {
    const csv = ["Name,Category,Quantity,Status,Date"]
      .concat(filtered.map((d) => `${d.name},${d.category},${d.quantity} ${d.unit},${d.status},${new Date(d.acceptedAt || d.createdAt).toLocaleDateString()}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rescue-history.csv";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Rescue History</h1>
          <p className="text-sm text-muted-foreground">{myDonations.length} total rescues</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["all", "active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search rescues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No rescue history yet</p>
          <p className="text-sm">Accept donations from the dashboard to start rescuing food</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food Item</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{d.emoji}</span>
                      <div>
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.providerName || "—"}</TableCell>
                  <TableCell className="text-sm text-foreground">{d.quantity} {d.unit}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${statusColor[d.status] || ""}`}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDonationShortDate(d.acceptedAt || d.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default History;

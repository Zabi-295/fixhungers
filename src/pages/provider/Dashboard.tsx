import { ClipboardList, Truck, Utensils, TrendingUp, Filter, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDonations } from "@/context/DonationContext";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Donation } from "@/context/DonationContext";
import { formatDonationShortDate } from "@/lib/donation-utils";
import { useNotifications } from "@/context/NotificationContext";
import { Bell } from "lucide-react";


const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Accepted: "bg-blue-100 text-blue-700",
  Collected: "bg-green-100 text-green-700",
  Completed: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
};

const Dashboard = () => {
  const { providerDonations, deleteDonation, updateDonationStatus } = useDonations();
  const { requestPermission, permission } = useNotifications();
  const navigate = useNavigate();


  const donations = providerDonations;

  const totalDonations = donations.length;
  const pendingCount = donations.filter((d) => d.status === "Pending").length;
  const completedCount = donations.filter((d) => d.status === "Completed" || d.status === "Collected").length;
  const mealsSaved = donations.reduce((acc, d) => {
    const num = parseInt(d.quantity) || 0;
    return acc + num * 2;
  }, 0);

  const recentDonations = donations.slice(0, 10);

  const stats = [
    { label: "Total Donations", value: totalDonations.toLocaleString(), change: `${pendingCount} pending`, icon: ClipboardList },
    { label: "Active Pickups", value: pendingCount.toString(), change: "In progress", icon: Truck },
    { label: "Meals Saved", value: mealsSaved.toLocaleString(), change: `${completedCount} completed`, icon: Utensils },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Notification Banner */}
      {permission === "default" && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Enable Real-time Updates</p>
              <p className="text-xs text-muted-foreground">Get notified on your mobile/PC when an NGO accepts your food.</p>
            </div>
          </div>
          <Button size="sm" onClick={requestPermission} className="w-full sm:w-auto text-xs">Enable Notifications</Button>
        </div>
      )}

      {/* Header */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Provider Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! You have <span className="font-semibold text-foreground">{totalDonations}</span> total donations.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2 rounded-full px-5 w-full sm:w-auto" onClick={() => navigate("/provider/donate")}>
          <Plus className="w-4 h-4" /> Donate Food
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-primary font-medium flex items-center gap-0.5 mb-1">
                <TrendingUp className="w-3 h-3" /> {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Donations */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-bold text-foreground">Recent Donations</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/provider/donate")} className="gap-1">
            <Plus className="w-3 h-3" /> Add New
          </Button>
        </div>
        {recentDonations.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <p className="text-lg mb-2">No donations yet</p>
            {totalDonations > 0 && (
              <p className="text-xs text-amber-500 mb-4">Note: {totalDonations} total donations exist in system, but none match your ID.</p>
            )}
            <p className="text-sm mb-4">Start by adding your first food donation</p>
            <Button onClick={() => navigate("/provider/donate")} className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Add First Donation
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-primary font-semibold">Food Item</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden sm:table-cell">Quantity</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden md:table-cell">Expiry Date</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold hidden lg:table-cell">Accepted By</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold">Status</TableHead>
                <TableHead className="text-xs uppercase text-primary font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDonations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {d.image ? (
                        <img src={d.image} alt={d.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      ) : (
                        <span className="text-2xl">{d.emoji}</span>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground hidden sm:table-cell">{d.quantity}</TableCell>
                   <TableCell className="text-foreground hidden md:table-cell">{formatDonationShortDate(d.expiryDate)}</TableCell>
                  <TableCell className="text-sm hidden lg:table-cell">
                    {d.acceptedBy ? (
                      <span className="text-primary font-medium">{d.acceptedBy}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={d.status} onValueChange={(val) => updateDonationStatus(d.id, val as Donation["status"])}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <Badge variant="secondary" className={`text-xs font-medium ${statusColor[d.status] || ""}`}>
                          ● {d.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Collected">Collected</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteDonation(d.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {recentDonations.length > 0 && (
          <div className="flex items-center justify-between p-5 pt-3 text-sm text-muted-foreground">
            <span>Showing {recentDonations.length} of {totalDonations} donations</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/provider/history")}>View All History</Button>
          </div>
        )}
      </div>

      {/* AI Insight */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-5">
        <div className="flex items-center gap-1 text-xs font-semibold text-primary uppercase mb-3">✨ AI Impact Insight</div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          {totalDonations > 0 ? `You've donated ${totalDonations} items so far!` : "Start donating to see your impact!"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {totalDonations > 0
            ? `That's approximately ${mealsSaved} meals saved. Keep up the great work in reducing food waste!`
            : "Every donation counts. Add your first food item to start making a difference."}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

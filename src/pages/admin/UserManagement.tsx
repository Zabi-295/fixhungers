import { useState } from "react";
import { useAdmin, RegisteredUser } from "@/context/AdminContext";

import { useDonations, Donation } from "@/context/DonationContext";
import { Search, UserPlus, Pencil, Trash2, Users, CheckCircle, ArrowLeft, X, MapPin, Package, Calendar, Clock, TrendingUp, ShieldAlert, Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Link } from "react-router-dom";
import { getNumericQuantity } from "@/lib/donation-utils";

const UserManagement = () => {
  const { users, toggleUserStatus, deleteUser, addUser, editUser, verifyNGO } = useAdmin();
  const { donations } = useDonations();
  const [filter, setFilter] = useState<"all" | "Provider" | "NGO">("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Provider" | "NGO">("Provider");
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);

  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"directory" | "verifications">("directory");
  const [reviewNGO, setReviewNGO] = useState<RegisteredUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const pendingNGOs = users.filter((u) => u.role === "NGO" && u.verificationStatus === "pending");
  
  // Edit logic
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"Provider" | "NGO">("Provider");

  const startEditing = (u: RegisteredUser, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details modal
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    await editUser(editingUser.id, { name: editName, email: editEmail, role: editRole });
    setEditingUser(null);
  };

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const providers = users.filter((u) => u.role === "Provider" && u.status).length;
  const ngos = users.filter((u) => u.role === "NGO" && u.status).length;
  const newRegs = users.filter((u) => {
    const d = Date.now() - new Date(u.registeredAt).getTime();
    return d < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const handleAdd = async () => {
    if (!newName || !newEmail || !newPassword) return;
    await addUser({ name: newName, email: newEmail, password: newPassword, role: newRole, location: "Lahore, Pakistan" });
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setShowAdd(false);
  };

  const userDonations = selectedUser?.role === "Provider" 
    ? donations.filter(d => d.providerId === selectedUser.id)
    : selectedUser?.role === "NGO" 
      ? donations.filter(d => d.acceptedById === selectedUser.id)
      : [];

  const totalQuantity = userDonations.reduce((acc, d) => {
    return acc + getNumericQuantity(d.quantity);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">Admin › User Directory</div>
        <Link to="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Directory</h1>
          <p className="text-sm text-muted-foreground">Manage and oversee all system stakeholders.</p>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-3 border-l-4 border-l-primary">
          <h3 className="font-semibold text-foreground">Edit User: {editingUser.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" className="px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={editRole} onChange={(e) => setEditRole(e.target.value as any)} className="px-3 py-2 rounded-lg border border-border text-sm bg-card focus:outline-none">
              <option value="Provider">Provider</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save Changes</button>
            <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeTab === "directory" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          User Directory
          {activeTab === "directory" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("verifications")}
          className={`pb-3 text-sm font-semibold relative transition flex items-center gap-1.5 ${
            activeTab === "verifications" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Verification Requests
          {pendingNGOs.length > 0 ? (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
              {pendingNGOs.length}
            </span>
          ) : (
            <span className="bg-muted text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full">
              0
            </span>
          )}
          {activeTab === "verifications" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "directory" ? (
        <div className="bg-card rounded-xl border border-border p-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex gap-2 flex-wrap">
              {(["all", "Provider", "NGO"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f === "all" ? "All Users" : f === "Provider" ? "Providers" : "NGOs"}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm bg-card w-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">User Identity</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Role</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Registration Date</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                )}
                {filtered.map((u) => (
                  <tr 
                    key={u.id} 
                    className="border-b border-border hover:bg-muted/30 transition cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                          {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        u.role === "Provider" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.id); }}
                          className={`w-10 h-5 rounded-full transition-all relative ${u.status ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-all ${u.status ? "left-5" : "left-0.5"}`} />
                        </button>
                        <span className="text-xs">{u.status ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(u.registeredAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => startEditing(u, e)} className="p-1.5 hover:bg-muted rounded transition"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteUser(u.id); }} className="p-1.5 hover:bg-destructive/10 rounded transition"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-primary">Showing {filtered.length} of {users.length} users</div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">Pending Verification Requests</h2>
          <p className="text-xs text-muted-foreground mb-6">Review documents submitted by registered NGOs to grant them system access.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">NGO Identity</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Submitted Date</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Verification Status</th>
                  <th className="text-left py-3 px-3 text-xs text-primary font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingNGOs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground italic">
                      No pending verification requests found.
                    </td>
                  </tr>
                )}
                {pendingNGOs.map((ngo) => (
                  <tr key={ngo.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                          {ngo.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{ngo.name}</p>
                          <p className="text-xs text-muted-foreground">{ngo.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {ngo.verificationDocs?.submittedAt 
                        ? new Date(ngo.verificationDocs.submittedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
                        : "N/A"
                      }
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-3 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 animate-pulse">
                        Pending Review
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          setReviewNGO(ngo);
                          setRejectionReason("");
                        }}
                        className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Review Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary border border-primary/20">
                  {selectedUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedUser.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      selectedUser.role === 'Provider' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {selectedUser.role}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center">
                  <Package className="w-5 h-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{userDonations.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                    Total {selectedUser.role === 'Provider' ? 'Donations' : 'Pickups'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{totalQuantity.toFixed(1)}kg</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Total Weight</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round((userDonations.filter(d => d.status === 'Completed').length / (userDonations.length || 1)) * 100)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Completion Rate</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center">
                  <Calendar className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {new Date(selectedUser.registeredAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Member Since</p>
                </div>
              </div>

              {/* User Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Profile Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                      <span className="text-xs text-muted-foreground flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Address</span>
                      <span className="text-sm font-medium">{selectedUser.location || "Lahore, Pakistan"}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                      <span className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Account Status</span>
                      <Badge className={selectedUser.status ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}>
                        {selectedUser.status ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-primary rotate-180" /> Recent Activity
                  </h3>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm text-foreground font-medium mb-1">Last Interaction</p>
                    <p className="text-xs text-muted-foreground">
                      {userDonations.length > 0 
                        ? `Handled ${userDonations[0].name} on ${new Date(userDonations[0].createdAt).toLocaleDateString()}`
                        : "No recent activity recorded."}
                    </p>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> 
                    {selectedUser.role === 'Provider' ? 'Donation' : 'Pickup'} History
                  </h3>
                  <span className="text-[10px] text-muted-foreground px-2 py-1 bg-muted rounded-md">Showing last {userDonations.length} records</span>
                </div>
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-bold text-primary uppercase">Item Details</th>
                          <th className="px-4 py-3 font-bold text-primary uppercase">Status</th>
                          <th className="px-4 py-3 font-bold text-primary uppercase">Date</th>
                          <th className="px-4 py-3 font-bold text-primary uppercase">{selectedUser.role === 'Provider' ? 'Accepted By' : 'Donated By'}</th>
                          <th className="px-4 py-3 font-bold text-primary uppercase text-right">Review/Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {userDonations.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-12 text-muted-foreground italic bg-card">No records found for this user.</td></tr>
                        ) : (
                          userDonations.map(d => (
                            <tr key={d.id} className="hover:bg-primary/5 transition-colors bg-card">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-xl bg-muted w-8 h-8 rounded-lg flex items-center justify-center">{d.emoji}</span>
                                  <div>
                                    <p className="font-bold text-foreground">{d.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{d.category} • {d.quantity} {d.unit}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                  d.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 
                                  d.status === 'Accepted' ? 'bg-blue-500/10 text-blue-500' : 
                                  d.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-muted-foreground font-medium">
                                {new Date(d.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                                    {(selectedUser.role === 'Provider' ? d.acceptedBy : d.providerName)?.charAt(0) || '?'}
                                  </div>
                                  <span className="font-medium text-foreground">
                                    {selectedUser.role === 'Provider' ? (d.acceptedBy || "Not accepted yet") : (d.providerName || "Unknown")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                {d.review ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-primary">
                                      <span className="font-bold">{d.review.rating}</span>
                                      <span className="text-[10px]">⭐</span>
                                    </div>
                                    {d.review.comment && (
                                      <p className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={d.review.comment}>
                                        "{d.review.comment}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 italic">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-8 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
              >
                Close Detailed View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Documents Modal */}
      {reviewNGO && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h2 className="text-xl font-bold text-foreground">Review NGO Documents</h2>
                <p className="text-xs text-muted-foreground mt-1">Reviewing submissions for <strong>{reviewNGO.name}</strong> ({reviewNGO.email})</p>
              </div>
              <button 
                onClick={() => setReviewNGO(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable Document Previews */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Certificate */}
                <div className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col h-[320px]">
                  <h4 className="font-bold text-xs text-primary uppercase mb-2">NGO License/Certificate</h4>
                  <div className="flex-1 bg-muted/30 border border-border rounded-lg overflow-hidden flex items-center justify-center relative group">
                    {reviewNGO.verificationDocs?.ngoCertificate ? (
                      reviewNGO.verificationDocs.ngoCertificate.startsWith("data:application/pdf") ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-primary" />
                          <span className="text-xs font-semibold text-foreground">PDF Document</span>
                          <a 
                            href={reviewNGO.verificationDocs.ngoCertificate} 
                            download={`${reviewNGO.name}_certificate.pdf`}
                            className="text-xs text-primary underline font-medium"
                          >
                            Download PDF
                          </a>
                        </div>
                      ) : (
                        <img 
                          src={reviewNGO.verificationDocs.ngoCertificate} 
                          alt="NGO Certificate" 
                          className="w-full h-full object-contain cursor-pointer transition hover:scale-105" 
                          onClick={() => window.open(reviewNGO.verificationDocs?.ngoCertificate)}
                        />
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No Certificate Uploaded</span>
                    )}
                  </div>
                </div>

                {/* CNIC Front */}
                <div className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col h-[320px]">
                  <h4 className="font-bold text-xs text-primary uppercase mb-2">CNIC Front Side</h4>
                  <div className="flex-1 bg-muted/30 border border-border rounded-lg overflow-hidden flex items-center justify-center">
                    {reviewNGO.verificationDocs?.cnicFront ? (
                      <img 
                        src={reviewNGO.verificationDocs.cnicFront} 
                        alt="CNIC Front" 
                        className="w-full h-full object-contain cursor-pointer transition hover:scale-105" 
                        onClick={() => window.open(reviewNGO.verificationDocs?.cnicFront)}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No CNIC Front Uploaded</span>
                    )}
                  </div>
                </div>

                {/* CNIC Back */}
                <div className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col h-[320px]">
                  <h4 className="font-bold text-xs text-primary uppercase mb-2">CNIC Back Side</h4>
                  <div className="flex-1 bg-muted/30 border border-border rounded-lg overflow-hidden flex items-center justify-center">
                    {reviewNGO.verificationDocs?.cnicBack ? (
                      <img 
                        src={reviewNGO.verificationDocs.cnicBack} 
                        alt="CNIC Back" 
                        className="w-full h-full object-contain cursor-pointer transition hover:scale-105" 
                        onClick={() => window.open(reviewNGO.verificationDocs?.cnicBack)}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No CNIC Back Uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Field */}
              <div className="border-t border-border pt-4">
                <label className="block text-xs font-bold text-foreground uppercase mb-2">
                  Rejection Reason (Only required if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide details about why the documents were rejected (e.g. 'CNIC is blurry', 'Registration certificate has expired'). This reason will be emailed to the NGO."
                  className="w-full h-20 px-3 py-2 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Reviewing these files grants approval to join the live network.
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  disabled={submittingAction}
                  onClick={async () => {
                    if (!window.confirm(`Are you sure you want to approve ${reviewNGO.name}?`)) return;
                    setSubmittingAction(true);
                    try {
                      await verifyNGO(reviewNGO.id, "approve");
                      toast({ title: "NGO Approved", description: `${reviewNGO.name} is now verified.` });
                      setReviewNGO(null);
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message || "Failed to approve NGO", variant: "destructive" });
                    } finally {
                      setSubmittingAction(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center"
                >
                  Approve NGO
                </button>
                <button
                  disabled={submittingAction}
                  onClick={async () => {
                    if (!rejectionReason.trim()) {
                      alert("Please provide a rejection reason before rejecting.");
                      return;
                    }
                    if (!window.confirm(`Are you sure you want to reject ${reviewNGO.name}?`)) return;
                    setSubmittingAction(true);
                    try {
                      await verifyNGO(reviewNGO.id, "reject", rejectionReason.trim());
                      toast({ title: "NGO Rejected", description: `Verification request has been rejected.` });
                      setReviewNGO(null);
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message || "Failed to reject NGO", variant: "destructive" });
                    } finally {
                      setSubmittingAction(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm rounded-xl transition shadow-md"
                >
                  Reject NGO
                </button>
                <button
                  onClick={() => setReviewNGO(null)}
                  className="px-6 py-2.5 bg-muted text-foreground hover:bg-muted/80 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;

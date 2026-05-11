const AdminSettings = () => (
  <div className="max-w-xl mx-auto">
    <h1 className="text-2xl font-bold text-foreground mb-6">Admin Settings</h1>
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      {[
        { label: "Email Notifications", desc: "Receive alerts for new registrations" },
        { label: "System Alerts", desc: "Get notified about critical system events" },
        { label: "Weekly Reports", desc: "Receive weekly summary via email" },
      ].map((s, i) => (
        <div key={i} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
          <div className="w-10 h-5 rounded-full bg-primary relative cursor-pointer">
            <span className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-card shadow" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminSettings;

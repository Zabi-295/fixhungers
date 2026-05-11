const AdminProfile = () => (
  <div className="max-w-xl mx-auto">
    <h1 className="text-2xl font-bold text-foreground mb-6">Admin Profile</h1>
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">A</div>
        <div>
          <p className="text-lg font-bold text-foreground">Admin User</p>
          <p className="text-sm text-muted-foreground">adminfixhunger@gmail.com</p>
          <p className="text-xs text-primary">System Administrator</p>
        </div>
      </div>
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Role</span><span className="font-medium text-foreground">Super Admin</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last Login</span><span className="font-medium text-foreground">{new Date().toLocaleDateString()}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account Status</span><span className="text-primary font-medium">Active</span></div>
      </div>
    </div>
  </div>
);

export default AdminProfile;

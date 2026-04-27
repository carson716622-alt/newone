import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Settings, Users, Shield, Flame, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { DEPARTMENT_LABELS, UNIT_STATUS_LABELS } from "@shared/types";

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: units, refetch } = trpc.units.list.useQuery();
  const adminUpdate = trpc.units.adminUpdate.useMutation({
    onSuccess: () => { refetch(); toast.success("Unit updated"); },
    onError: (err) => toast.error(err.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ department: "leo", badgeNumber: "", callsign: "" });

  const deptIcon = (dept: string) => {
    if (dept === "leo") return <Shield className="h-3.5 w-3.5 text-blue-400" />;
    if (dept === "fire_ems") return <Flame className="h-3.5 w-3.5 text-red-400" />;
    if (dept === "dispatch") return <Radio className="h-3.5 w-3.5 text-amber-400" />;
    return <Settings className="h-3.5 w-3.5 text-purple-400" />;
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="bg-card border-border/50 max-w-md w-full">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-50" />
              <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground mt-2">You do not have admin privileges to access this panel.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-500" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, departments, and system settings</p>
        </div>

        {/* User Management */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!units || units.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No registered users</p>
            ) : (
              <div className="space-y-2">
                {units.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
                    {editingId === unit.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <Select value={editForm.department} onValueChange={v => setEditForm(f => ({ ...f, department: v }))}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leo">LEO</SelectItem>
                            <SelectItem value="fire_ems">Fire/EMS</SelectItem>
                            <SelectItem value="dispatch">Dispatch</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={editForm.badgeNumber} onChange={e => setEditForm(f => ({ ...f, badgeNumber: e.target.value }))} placeholder="Badge #" className="w-24 data-field" />
                        <Input value={editForm.callsign} onChange={e => setEditForm(f => ({ ...f, callsign: e.target.value }))} placeholder="Callsign" className="w-24 data-field" />
                        <Button size="sm" onClick={() => { adminUpdate.mutate({ userId: unit.id, department: editForm.department as any, badgeNumber: editForm.badgeNumber || undefined, callsign: editForm.callsign || undefined }); setEditingId(null); }} className="bg-green-600 hover:bg-green-700 text-white text-xs">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-xs">Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          {deptIcon(unit.department)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{unit.name || `User ${unit.id}`}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">{DEPARTMENT_LABELS[unit.department as keyof typeof DEPARTMENT_LABELS] || unit.department}</span>
                              {unit.badgeNumber && <span className="text-xs text-muted-foreground data-field">#{unit.badgeNumber}</span>}
                              {unit.callsign && <span className="text-xs text-muted-foreground data-field">{unit.callsign}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`status-${unit.unitStatus.replace("_", "-")} text-[10px]`}>
                            {UNIT_STATUS_LABELS[unit.unitStatus as keyof typeof UNIT_STATUS_LABELS]}
                          </Badge>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setEditingId(unit.id); setEditForm({ department: unit.department, badgeNumber: unit.badgeNumber || "", callsign: unit.callsign || "" }); }}>Edit</Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold text-foreground data-field">{units?.length ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">LEO Units</p>
                <p className="text-xl font-bold text-blue-400 data-field">{units?.filter(u => u.department === "leo").length ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Fire/EMS Units</p>
                <p className="text-xl font-bold text-red-400 data-field">{units?.filter(u => u.department === "fire_ems").length ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Dispatch Units</p>
                <p className="text-xl font-bold text-amber-400 data-field">{units?.filter(u => u.department === "dispatch").length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

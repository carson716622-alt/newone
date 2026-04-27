import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, Flame, Radio } from "lucide-react";
import { toast } from "sonner";
import { UNIT_STATUS_LABELS, DEPARTMENT_LABELS } from "@shared/types";

export default function UnitStatusBoard() {
  const { data: units, refetch } = trpc.units.list.useQuery(undefined, { refetchInterval: 5000 });
  const updateStatus = trpc.units.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
  });

  const statusOrder = ["available", "en_route", "on_scene", "busy", "off_duty"] as const;
  const deptIcon = (dept: string) => {
    if (dept === "leo") return <Shield className="h-3.5 w-3.5 text-blue-400" />;
    if (dept === "fire_ems") return <Flame className="h-3.5 w-3.5 text-red-400" />;
    if (dept === "dispatch") return <Radio className="h-3.5 w-3.5 text-amber-400" />;
    return <Users className="h-3.5 w-3.5 text-purple-400" />;
  };

  const groupedByStatus = statusOrder.map(status => ({
    status,
    label: UNIT_STATUS_LABELS[status],
    units: (units || []).filter(u => u.unitStatus === status),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-foreground" />
              Unit Status Board
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time status of all active units across departments</p>
          </div>
          <div className="flex gap-2">
            <Card className="bg-card border-border/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-lg font-bold text-foreground data-field">{units?.length ?? 0}</p>
            </Card>
          </div>
        </div>

        {/* My Status Quick Toggle */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Update My Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusOrder.map(status => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  className={`status-${status.replace("_", "-")} border-0 text-xs`}
                  onClick={() => updateStatus.mutate({ status })}
                  disabled={updateStatus.isPending}
                >
                  {UNIT_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupedByStatus.map(group => (
            <Card key={group.status} className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full status-${group.status.replace("_", "-")}`} />
                    {group.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{group.units.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.units.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No units</p>
                ) : (
                  <div className="space-y-1.5">
                    {group.units.map(unit => (
                      <div key={unit.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <div className="flex items-center gap-2">
                          {deptIcon(unit.department)}
                          <div>
                            <p className="text-sm font-medium text-foreground data-field">
                              {unit.callsign || unit.name || `Unit ${unit.id}`}
                            </p>
                            {unit.badgeNumber && (
                              <p className="text-[10px] text-muted-foreground data-field">#{unit.badgeNumber}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {DEPARTMENT_LABELS[unit.department as keyof typeof DEPARTMENT_LABELS] || unit.department}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

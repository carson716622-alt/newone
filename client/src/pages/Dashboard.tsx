import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Users, AlertTriangle, FileText, Radio, Shield, Flame, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { CALL_PRIORITY_LABELS, CALL_STATUS_LABELS } from "@shared/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activeCalls } = trpc.dashboard.activeCalls.useQuery(undefined, { refetchInterval: 10000 });
  const { data: notifications } = trpc.notifications.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">System overview and active operations</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setLocation("/dispatch")}>
              <Radio className="h-4 w-4 mr-1" /> New Call
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLocation("/warrants")}>
              <AlertTriangle className="h-4 w-4 mr-1" /> BOLO
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Calls</p>
                  <p className="text-3xl font-bold text-foreground mt-1 data-field">{stats?.activeCalls ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Units</p>
                  <p className="text-3xl font-bold text-foreground mt-1 data-field">{stats?.availableUnits ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Warrants</p>
                  <p className="text-3xl font-bold text-foreground mt-1 data-field">{stats?.activeWarrants ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active BOLOs</p>
                  <p className="text-3xl font-bold text-foreground mt-1 data-field">{stats?.activeBolos ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Calls & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Calls */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-amber-500" />
                  Active Calls for Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!activeCalls || activeCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active calls</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCalls.slice(0, 8).map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => setLocation("/dispatch")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge className={`text-[10px] px-1.5 py-0.5 priority-${call.priority}`}>
                            {CALL_PRIORITY_LABELS[call.priority as keyof typeof CALL_PRIORITY_LABELS] || call.priority}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{call.nature}</p>
                            <p className="text-xs text-muted-foreground truncate data-field">{call.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] || call.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground data-field">
                            {call.caseNumber}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <div>
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!notifications || notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 6).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg border ${
                          notif.isRead ? "border-border/30 bg-secondary/30" : "border-blue-500/30 bg-blue-500/5"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 data-field">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

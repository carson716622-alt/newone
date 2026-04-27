import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Phone, MapPin, Clock, Plus, FileText, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CALL_PRIORITY_LABELS, CALL_STATUS_LABELS, UNIT_STATUS_LABELS } from "@shared/types";

export default function FireEmsPanel() {
  const [showReportForm, setShowReportForm] = useState(false);
  const { data: activeCalls } = trpc.calls.active.useQuery(undefined, { refetchInterval: 5000 });
  const { data: units } = trpc.units.list.useQuery(undefined, { refetchInterval: 10000 });
  const updateStatus = trpc.units.updateStatus.useMutation({ onSuccess: () => toast.success("Status updated") });
  const createReport = trpc.reports.create.useMutation({ onSuccess: () => { setShowReportForm(false); toast.success("Report filed"); } });

  const [reportForm, setReportForm] = useState({ type: "patient_care" as string, title: "", narrative: "", location: "" });

  const fireCalls = activeCalls?.filter(c => c.department === "fire_ems" || c.department === "both") || [];
  const fireUnits = units?.filter(u => u.department === "fire_ems") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Flame className="h-6 w-6 text-red-500" />
              Fire/EMS Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Active calls, unit management, and reporting</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> New Report</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>File Report</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Report Type</Label>
                    <select value={reportForm.type} onChange={e => setReportForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="patient_care">Patient Care Report</option>
                      <option value="fire_incident">Fire Incident Report</option>
                    </select>
                  </div>
                  <div><Label>Title *</Label><Input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Location</Label><Input value={reportForm.location} onChange={e => setReportForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Narrative *</Label><Textarea value={reportForm.narrative} onChange={e => setReportForm(f => ({ ...f, narrative: e.target.value }))} className="mt-1" rows={5} /></div>
                  <Button onClick={() => createReport.mutate({ ...reportForm, type: reportForm.type as any })} className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={createReport.isPending}>Submit Report</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="calls">Active Calls</TabsTrigger>
            <TabsTrigger value="units">Unit Status</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Active Calls */}
          <TabsContent value="calls" className="mt-4">
            {fireCalls.length === 0 ? (
              <Card className="bg-card border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Phone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No active Fire/EMS calls</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {fireCalls.map(call => (
                  <Card key={call.id} className="bg-card border-border/50 border-l-2 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] px-1.5 py-0.5 priority-${call.priority}`}>
                              {CALL_PRIORITY_LABELS[call.priority as keyof typeof CALL_PRIORITY_LABELS]}
                            </Badge>
                            <span className="text-xs text-muted-foreground data-field">{call.caseNumber}</span>
                          </div>
                          <h3 className="font-semibold text-foreground">{call.nature}</h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{call.location}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(call.createdAt).toLocaleTimeString()}</span>
                          </div>
                          {call.description && <p className="text-xs text-muted-foreground mt-2">{call.description}</p>}
                        </div>
                        <Badge variant="outline">{CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS]}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Unit Status */}
          <TabsContent value="units" className="mt-4">
            <div className="space-y-4">
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" /> My Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(["available", "busy", "en_route", "on_scene", "off_duty"] as const).map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        className={`status-${status.replace("_", "-")} border-0`}
                        onClick={() => updateStatus.mutate({ status })}
                      >
                        {UNIT_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Fire/EMS Units</CardTitle>
                </CardHeader>
                <CardContent>
                  {fireUnits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No Fire/EMS units registered</p>
                  ) : (
                    <div className="space-y-2">
                      {fireUnits.map(unit => (
                        <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div>
                            <p className="text-sm font-medium text-foreground data-field">{unit.callsign || unit.name || `Unit ${unit.id}`}</p>
                            <p className="text-xs text-muted-foreground">{unit.badgeNumber && `Badge: ${unit.badgeNumber}`}</p>
                          </div>
                          <Badge className={`status-${unit.unitStatus.replace("_", "-")} text-[10px]`}>
                            {UNIT_STATUS_LABELS[unit.unitStatus as keyof typeof UNIT_STATUS_LABELS]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-4">
            <Card className="bg-card border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Use the "New Report" button to file patient care or fire incident reports</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

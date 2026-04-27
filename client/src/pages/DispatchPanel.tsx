import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Radio, Plus, Phone, MapPin, User, Clock, UserPlus, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CALL_PRIORITY_LABELS, CALL_STATUS_LABELS } from "@shared/types";

export default function DispatchPanel() {
  const [showNewCall, setShowNewCall] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [disposition, setDisposition] = useState("");

  const { data: calls, refetch: refetchCalls } = trpc.calls.active.useQuery(undefined, { refetchInterval: 5000 });
  const { data: allCalls } = trpc.calls.list.useQuery({ status: statusFilter === "active" ? undefined : statusFilter });
  const { data: units } = trpc.units.list.useQuery();
  const { data: callNotes } = trpc.calls.getNotes.useQuery(
    { callId: selectedCallId! },
    { enabled: !!selectedCallId }
  );

  const createCall = trpc.calls.create.useMutation({ onSuccess: () => { refetchCalls(); setShowNewCall(false); toast.success("Call created"); } });
  const updateCall = trpc.calls.update.useMutation({ onSuccess: () => { refetchCalls(); toast.success("Call updated"); } });
  const assignUnit = trpc.calls.assignUnit.useMutation({ onSuccess: () => { refetchCalls(); toast.success("Unit assigned"); } });
  const addNote = trpc.calls.addNote.useMutation({ onSuccess: () => { setNoteContent(""); toast.success("Note added"); } });

  const [form, setForm] = useState({
    nature: "", priority: "code_2" as string, location: "", description: "",
    callerName: "", callerPhone: "", department: "leo" as string,
  });

  const handleCreateCall = () => {
    if (!form.nature || !form.location) { toast.error("Nature and location are required"); return; }
    createCall.mutate({
      nature: form.nature,
      priority: form.priority as any,
      location: form.location,
      description: form.description || undefined,
      callerName: form.callerName || undefined,
      callerPhone: form.callerPhone || undefined,
      department: form.department as any,
    });
    setForm({ nature: "", priority: "code_2", location: "", description: "", callerName: "", callerPhone: "", department: "leo" });
  };

  const availableUnits = units?.filter(u => u.unitStatus === "available") || [];
  const displayCalls = statusFilter === "active" ? calls : allCalls;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Radio className="h-6 w-6 text-amber-500" />
              Dispatch Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage calls for service and unit assignments</p>
          </div>
          <Dialog open={showNewCall} onOpenChange={setShowNewCall}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="h-4 w-4 mr-1" /> New Call
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Call for Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nature of Call *</Label>
                    <Input value={form.nature} onChange={e => setForm(f => ({ ...f, nature: e.target.value }))} placeholder="e.g. Traffic Stop" className="mt-1 data-field" />
                  </div>
                  <div>
                    <Label>Priority *</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code_1">Code 1 - Low</SelectItem>
                        <SelectItem value="code_2">Code 2 - Medium</SelectItem>
                        <SelectItem value="code_3">Code 3 - High</SelectItem>
                        <SelectItem value="code_4">Code 4 - Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Address or intersection" className="mt-1 data-field" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details..." className="mt-1" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Caller Name</Label>
                    <Input value={form.callerName} onChange={e => setForm(f => ({ ...f, callerName: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Caller Phone</Label>
                    <Input value={form.callerPhone} onChange={e => setForm(f => ({ ...f, callerPhone: e.target.value }))} className="mt-1 data-field" />
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leo">LEO</SelectItem>
                      <SelectItem value="fire_ems">Fire/EMS</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateCall} className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={createCall.isPending}>
                  {createCall.isPending ? "Creating..." : "Dispatch Call"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["active", "all", "closed"].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-amber-600 text-white" : ""}>
              {s === "active" ? "Active" : s === "all" ? "All" : "Closed"}
            </Button>
          ))}
        </div>

        {/* Active Calls Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {!displayCalls || displayCalls.length === 0 ? (
              <Card className="bg-card border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Phone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No calls to display</p>
                </CardContent>
              </Card>
            ) : (
              displayCalls.map(call => (
                <Card key={call.id} className={`bg-card border-border/50 hover:border-amber-500/30 transition-colors ${selectedCallId === call.id ? "border-amber-500/60 ring-1 ring-amber-500/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedCallId(selectedCallId === call.id ? null : call.id)}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] px-1.5 py-0.5 priority-${call.priority}`}>
                            {CALL_PRIORITY_LABELS[call.priority as keyof typeof CALL_PRIORITY_LABELS]}
                          </Badge>
                          <span className="text-xs text-muted-foreground data-field">{call.caseNumber}</span>
                          <Badge variant="outline" className="text-[10px]">{CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS]}</Badge>
                        </div>
                        <h3 className="font-semibold text-foreground">{call.nature}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{call.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(call.createdAt).toLocaleTimeString()}</span>
                          {call.callerName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{call.callerName}</span>}
                        </div>
                        {call.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{call.description}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {call.status !== "closed" && (
                          <div className="flex gap-1">
                            {call.status === "pending" && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateCall.mutate({ id: call.id, status: "dispatched" })}>
                                Dispatch
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-xs h-7 text-red-400 border-red-400/30" onClick={() => updateCall.mutate({ id: call.id, status: "closed" })}>
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Call Details: Notes & Assignment */}
                    {selectedCallId === call.id && call.status !== "closed" && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                        {/* Assign Unit */}
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-medium text-foreground">Assign Unit:</span>
                          <Select onValueChange={v => assignUnit.mutate({ callId: call.id, unitId: parseInt(v) })}>
                            <SelectTrigger className="w-48 h-7 text-xs"><SelectValue placeholder="Select unit..." /></SelectTrigger>
                            <SelectContent>
                              {availableUnits.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                  {u.callsign || u.name || `Unit ${u.id}`} ({u.department?.replace("_", "/")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Add Disposition */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">Disposition:</span>
                          <Input
                            value={disposition}
                            onChange={e => setDisposition(e.target.value)}
                            placeholder="Enter disposition..."
                            className="h-7 text-xs flex-1 data-field"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (disposition) {
                                updateCall.mutate({ id: call.id, disposition });
                                setDisposition("");
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>

                        {/* Call Notes */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-medium text-foreground">Call Notes</span>
                          </div>
                          {callNotes && callNotes.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {callNotes.map(note => (
                                <div key={note.id} className="text-xs p-2 rounded bg-secondary/50">
                                  <span className="text-muted-foreground data-field">[{new Date(note.createdAt).toLocaleTimeString()}]</span>{" "}
                                  <span className="text-foreground">{note.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              value={noteContent}
                              onChange={e => setNoteContent(e.target.value)}
                              placeholder="Add note..."
                              className="h-7 text-xs flex-1"
                              onKeyDown={e => {
                                if (e.key === "Enter" && noteContent) {
                                  addNote.mutate({ callId: call.id, content: noteContent });
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (noteContent) {
                                  addNote.mutate({ callId: call.id, content: noteContent });
                                }
                              }}
                              disabled={addNote.isPending}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Available Units */}
          <div>
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Available Units ({availableUnits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableUnits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No available units</p>
                ) : (
                  <div className="space-y-2">
                    {availableUnits.map(unit => (
                      <div key={unit.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <div>
                          <p className="text-sm font-medium text-foreground data-field">{unit.callsign || unit.name || `Unit ${unit.id}`}</p>
                          <p className="text-xs text-muted-foreground capitalize">{unit.department?.replace("_", "/")}</p>
                        </div>
                        <Badge className="status-available text-[10px]">Available</Badge>
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

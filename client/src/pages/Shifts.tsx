import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

type ShiftForm = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  unit: string;
  location: string;
  minimumOfficers: number;
  notes: string;
  status: "open" | "filled" | "shortage" | "cancelled";
};

const defaultForm: ShiftForm = {
  name: "",
  date: "",
  startTime: "08:00",
  endTime: "16:00",
  unit: "",
  location: "",
  minimumOfficers: 2,
  notes: "",
  status: "open",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    filled: "bg-green-100 text-green-800",
    shortage: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

export default function Shifts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "filled" | "shortage" | "cancelled">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ShiftForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [assignShiftId, setAssignShiftId] = useState<number | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");

  const utils = trpc.useUtils();

  const { data: shifts, isLoading } = trpc.shifts.list.useQuery({
    status: statusFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: officers } = trpc.officers.list.useQuery({ status: "active" });

  const createMutation = trpc.shifts.create.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowForm(false);
      setForm(defaultForm);
      toast.success("Shift created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.shifts.update.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      toast.success("Shift updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.shifts.delete.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDeleteId(null);
      toast.success("Shift deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const assignMutation = trpc.shifts.assign.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      utils.dashboard.stats.invalidate();
      setSelectedOfficerId("");
      toast.success("Officer assigned to shift");
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = trpc.shifts.unassign.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Officer unassigned");
    },
    onError: (e) => toast.error(e.message),
  });

  function openEdit(shift: any) {
    setEditId(shift.id);
    setForm({
      name: shift.name,
      date: new Date(shift.date).toISOString().split("T")[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      unit: shift.unit ?? "",
      location: shift.location ?? "",
      minimumOfficers: shift.minimumOfficers,
      notes: shift.notes ?? "",
      status: shift.status,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    const payload = {
      ...form,
      unit: form.unit || null,
      location: form.location || null,
      notes: form.notes || null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const assignShift = shifts?.find((s) => s.id === assignShiftId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-900" />
            Shifts
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and assign department shifts
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditId(null);
              setForm(defaultForm);
              setShowForm(true);
            }}
            className="bg-blue-900 hover:bg-blue-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Shift
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="shortage">Shortage</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-500 whitespace-nowrap">From:</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-500 whitespace-nowrap">To:</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStartDate(""); setEndDate(""); }}
            >
              Clear dates
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Shifts List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          ))
        ) : (shifts?.length ?? 0) === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="py-16 text-center text-gray-400">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No shifts found</p>
              <p className="text-sm mt-1">
                {isAdmin ? "Create your first shift to get started" : "No shifts match your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          shifts?.map((shift: any) => (
            <Card
              key={shift.id}
              className={`border-0 shadow-sm bg-white ${
                shift.status === "shortage" ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {shift.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(shift.status)}`}
                      >
                        {shift.status === "shortage" && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {shift.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                      <span>
                        {format(new Date(shift.date), "EEE, MMM d, yyyy")}
                      </span>
                      <span>
                        {shift.startTime} – {shift.endTime}
                      </span>
                      {shift.unit && <span>{shift.unit}</span>}
                      {shift.location && <span>{shift.location}</span>}
                    </div>
                    {/* Assigned Officers */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">
                        <Users className="h-3 w-3 inline mr-1" />
                        {shift.assignedCount ?? 0}/{shift.minimumOfficers} officers
                      </span>
                      {shift.assignedOfficers?.map((o: any) => (
                        <div
                          key={o.id}
                          className="flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                        >
                          <span>
                            {o.firstName} {o.lastName}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() =>
                                unassignMutation.mutate({
                                  shiftId: shift.id,
                                  officerId: o.id,
                                })
                              }
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignShiftId(shift.id)}
                        className="h-8 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(shift)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(shift.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Shift Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Shift" : "Create New Shift"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Shift Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning Patrol, Night Watch"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min. Officers</Label>
              <Input
                type="number"
                min={1}
                value={form.minimumOfficers}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minimumOfficers: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time *</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. Patrol, K-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="e.g. District 4"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Optional shift notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name ||
                !form.date ||
                !form.startTime ||
                !form.endTime ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editId
                ? "Update Shift"
                : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Officer Dialog */}
      <Dialog
        open={assignShiftId !== null}
        onOpenChange={(o) => !o && setAssignShiftId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Officer to Shift</DialogTitle>
          </DialogHeader>
          {assignShift && (
            <div className="py-2 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{assignShift.name}</p>
                <p className="text-gray-500">
                  {format(new Date(assignShift.date), "EEE, MMM d")} •{" "}
                  {assignShift.startTime} – {assignShift.endTime}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Select Officer</Label>
                <Select
                  value={selectedOfficerId}
                  onValueChange={setSelectedOfficerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {officers
                      ?.filter(
                        (o: any) =>
                          !assignShift.assignedOfficers?.some(
                            (ao: any) => ao.id === o.id
                          )
                      )
                      .map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          #{o.badgeNumber} — {o.firstName} {o.lastName} (
                          {o.rank})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignShiftId(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedOfficerId || assignMutation.isPending}
              onClick={() => {
                if (assignShiftId && selectedOfficerId) {
                  assignMutation.mutate({
                    shiftId: assignShiftId,
                    officerId: parseInt(selectedOfficerId),
                  });
                }
              }}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Officer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the shift and all its officer
              assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

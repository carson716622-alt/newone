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
import { Users, Plus, Search, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const RANKS = [
  "officer",
  "detective",
  "corporal",
  "sergeant",
  "lieutenant",
  "captain",
  "commander",
  "deputy_chief",
  "chief",
] as const;

const STATUSES = ["active", "inactive", "on_leave"] as const;

type OfficerForm = {
  badgeNumber: string;
  firstName: string;
  lastName: string;
  rank: (typeof RANKS)[number];
  unit: string;
  phone: string;
  email: string;
  hireDate: string;
  status: (typeof STATUSES)[number];
  maxWeeklyHours: number;
};

const defaultForm: OfficerForm = {
  badgeNumber: "",
  firstName: "",
  lastName: "",
  rank: "officer",
  unit: "",
  phone: "",
  email: "",
  hireDate: "",
  status: "active",
  maxWeeklyHours: 40,
};

function statusColor(status: string) {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "inactive") return "bg-gray-100 text-gray-600";
  if (status === "on_leave") return "bg-amber-100 text-amber-800";
  return "";
}

function rankLabel(rank: string) {
  return rank.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Officers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "on_leave">("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<OfficerForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: officers, isLoading } = trpc.officers.list.useQuery({
    search: search || undefined,
    status: statusFilter,
  });

  const createMutation = trpc.officers.create.useMutation({
    onSuccess: () => {
      utils.officers.list.invalidate();
      setShowForm(false);
      setForm(defaultForm);
      toast.success("Officer added successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.officers.update.useMutation({
    onSuccess: () => {
      utils.officers.list.invalidate();
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      toast.success("Officer updated successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.officers.delete.useMutation({
    onSuccess: () => {
      utils.officers.list.invalidate();
      setDeleteId(null);
      toast.success("Officer removed");
    },
    onError: (e) => toast.error(e.message),
  });

  function openEdit(officer: any) {
    setEditId(officer.id);
    setForm({
      badgeNumber: officer.badgeNumber,
      firstName: officer.firstName,
      lastName: officer.lastName,
      rank: officer.rank,
      unit: officer.unit ?? "",
      phone: officer.phone ?? "",
      email: officer.email ?? "",
      hireDate: officer.hireDate
        ? new Date(officer.hireDate).toISOString().split("T")[0]
        : "",
      status: officer.status,
      maxWeeklyHours: officer.maxWeeklyHours,
    });
    setShowForm(true);
  }

  function handleSubmit() {
    const payload = {
      ...form,
      hireDate: form.hireDate || null,
      unit: form.unit || null,
      phone: form.phone || null,
      email: form.email || null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-900" />
            Officers
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage department officer roster
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
            Add Officer
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or badge number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (officers?.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No officers found</p>
              <p className="text-sm mt-1">
                {isAdmin
                  ? "Add your first officer to get started"
                  : "No officers match your search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Badge
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Rank
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Unit
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Max Hrs/Wk
                    </th>
                    {isAdmin && (
                      <th className="text-right px-6 py-3 font-semibold text-gray-600">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {officers?.map((officer: any) => (
                    <tr
                      key={officer.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-blue-900">
                        #{officer.badgeNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {officer.firstName} {officer.lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {rankLabel(officer.rank)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {officer.unit ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(officer.status)}`}
                        >
                          {officer.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {officer.maxWeeklyHours}h
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(officer)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(officer.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Officer" : "Add New Officer"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Badge Number *</Label>
              <Input
                value={form.badgeNumber}
                onChange={(e) =>
                  setForm({ ...form, badgeNumber: e.target.value })
                }
                placeholder="e.g. 1042"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rank *</Label>
              <Select
                value={form.rank}
                onValueChange={(v: any) => setForm({ ...form, rank: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {rankLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. Patrol, Narcotics"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: any) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hire Date</Label>
              <Input
                type="date"
                value={form.hireDate}
                onChange={(e) =>
                  setForm({ ...form, hireDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Weekly Hours</Label>
              <Input
                type="number"
                min={1}
                max={80}
                value={form.maxWeeklyHours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxWeeklyHours: parseInt(e.target.value) || 40,
                  })
                }
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
                !form.badgeNumber ||
                !form.firstName ||
                !form.lastName ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editId
                ? "Update Officer"
                : "Add Officer"}
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
            <AlertDialogTitle>Remove Officer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this officer from the roster. All
              their shift assignments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

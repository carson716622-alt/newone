import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowLeftRight,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

type SwapForm = {
  requestingOfficerId: string;
  originalShiftId: string;
  targetOfficerId: string;
  targetShiftId: string;
  reason: string;
};

const defaultForm: SwapForm = {
  requestingOfficerId: "",
  originalShiftId: "",
  targetOfficerId: "",
  targetShiftId: "",
  reason: "",
};

function statusColor(status: string) {
  if (status === "accepted") return "bg-green-100 text-green-800";
  if (status === "denied") return "bg-red-100 text-red-800";
  if (status === "cancelled") return "bg-gray-100 text-gray-500";
  return "bg-amber-100 text-amber-800";
}

export default function Swaps() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "denied" | "cancelled">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SwapForm>(defaultForm);

  const utils = trpc.useUtils();

  const { data: swaps, isLoading } = trpc.swaps.list.useQuery({ status: statusFilter });
  const { data: officers } = trpc.officers.list.useQuery({ status: "active" });
  const { data: shifts } = trpc.shifts.list.useQuery({});

  const createMutation = trpc.swaps.create.useMutation({
    onSuccess: () => {
      utils.swaps.list.invalidate();
      setShowForm(false);
      setForm(defaultForm);
      toast.success("Swap request submitted");
    },
    onError: (e) => toast.error(e.message),
  });

  const reviewMutation = trpc.swaps.review.useMutation({
    onSuccess: () => {
      utils.swaps.list.invalidate();
      utils.shifts.list.invalidate();
      toast.success("Swap request updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.swaps.cancel.useMutation({
    onSuccess: () => {
      utils.swaps.list.invalidate();
      toast.success("Swap request cancelled");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-blue-900" />
            Shift Swaps
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage officer shift swap requests
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(defaultForm);
            setShowForm(true);
          }}
          className="bg-blue-900 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Swap
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Swaps List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          ))
        ) : (swaps?.length ?? 0) === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="py-16 text-center text-gray-400">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No swap requests found</p>
            </CardContent>
          </Card>
        ) : (
          swaps?.map((swap) => (
            <Card
              key={swap.id}
              className={`border-0 shadow-sm bg-white ${
                swap.status === "pending" ? "border-l-4 border-l-amber-400" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {swap.requestingOfficer
                          ? `${swap.requestingOfficer.firstName} ${swap.requestingOfficer.lastName}`
                          : "Unknown Officer"}
                      </span>
                      <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {swap.targetOfficer
                          ? `${swap.targetOfficer.firstName} ${swap.targetOfficer.lastName}`
                          : "Open Request"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(swap.status)}`}
                      >
                        {swap.status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm text-gray-500 space-y-0.5">
                      {swap.originalShift && (
                        <p>
                          <span className="text-gray-400">From: </span>
                          {swap.originalShift.name} —{" "}
                          {format(new Date(swap.originalShift.date), "MMM d, yyyy")}{" "}
                          {swap.originalShift.startTime}–{swap.originalShift.endTime}
                        </p>
                      )}
                      {swap.targetShift && (
                        <p>
                          <span className="text-gray-400">To: </span>
                          {swap.targetShift.name} —{" "}
                          {format(new Date(swap.targetShift.date), "MMM d, yyyy")}{" "}
                          {swap.targetShift.startTime}–{swap.targetShift.endTime}
                        </p>
                      )}
                      {swap.reason && (
                        <p className="italic text-gray-400">"{swap.reason}"</p>
                      )}
                    </div>
                  </div>
                  {isAdmin && swap.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewMutation.mutate({
                            id: swap.id,
                            action: "accepted",
                          })
                        }
                        className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewMutation.mutate({
                            id: swap.id,
                            action: "denied",
                          })
                        }
                        className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                  {!isAdmin && swap.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate({ id: swap.id })}
                      className="h-8 text-xs shrink-0"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Request Swap Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Swap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Requesting Officer *</Label>
              <Select
                value={form.requestingOfficerId}
                onValueChange={(v) =>
                  setForm({ ...form, requestingOfficerId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer..." />
                </SelectTrigger>
                <SelectContent>
                  {officers?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      #{o.badgeNumber} — {o.firstName} {o.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Their Shift (to give away) *</Label>
              <Select
                value={form.originalShiftId}
                onValueChange={(v) =>
                  setForm({ ...form, originalShiftId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift..." />
                </SelectTrigger>
                <SelectContent>
                  {shifts?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} — {format(new Date(s.date), "MMM d")} {s.startTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Officer (optional)</Label>
              <Select
                value={form.targetOfficerId}
                onValueChange={(v) =>
                  setForm({ ...form, targetOfficerId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Open request</SelectItem>
                  {officers?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      #{o.badgeNumber} — {o.firstName} {o.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Shift (optional)</Label>
              <Select
                value={form.targetShiftId}
                onValueChange={(v) =>
                  setForm({ ...form, targetShiftId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific shift</SelectItem>
                  {shifts?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} — {format(new Date(s.date), "MMM d")} {s.startTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
                placeholder="Brief reason for the swap..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  requestingOfficerId: parseInt(form.requestingOfficerId),
                  originalShiftId: parseInt(form.originalShiftId),
                  targetOfficerId: form.targetOfficerId
                    ? parseInt(form.targetOfficerId)
                    : null,
                  targetShiftId: form.targetShiftId
                    ? parseInt(form.targetShiftId)
                    : null,
                  reason: form.reason || null,
                })
              }
              disabled={
                !form.requestingOfficerId ||
                !form.originalShiftId ||
                createMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

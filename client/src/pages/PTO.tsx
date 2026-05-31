import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UmbrellaOff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

type PtoForm = {
  officerId: string;
  startDate: string;
  endDate: string;
  type: "vacation" | "sick" | "personal" | "bereavement" | "other";
  reason: string;
};

const defaultForm: PtoForm = {
  officerId: "",
  startDate: "",
  endDate: "",
  type: "vacation",
  reason: "",
};

function statusIcon(status: string) {
  if (status === "approved")
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "denied")
    return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function statusColor(status: string) {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "denied") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function PTO() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "denied">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PtoForm>(defaultForm);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "deny" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: ptoList, isLoading } = trpc.pto.list.useQuery({
    status: statusFilter,
  });

  const { data: officers } = trpc.officers.list.useQuery({ status: "active" });

  const createMutation = trpc.pto.create.useMutation({
    onSuccess: () => {
      utils.pto.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowForm(false);
      setForm(defaultForm);
      toast.success("PTO request submitted");
    },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.pto.approve.useMutation({
    onSuccess: () => {
      utils.pto.list.invalidate();
      utils.dashboard.stats.invalidate();
      setReviewId(null);
      setReviewAction(null);
      setReviewNotes("");
      toast.success("PTO request approved");
    },
    onError: (e) => toast.error(e.message),
  });

  const denyMutation = trpc.pto.deny.useMutation({
    onSuccess: () => {
      utils.pto.list.invalidate();
      utils.dashboard.stats.invalidate();
      setReviewId(null);
      setReviewAction(null);
      setReviewNotes("");
      toast.success("PTO request denied");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleReview() {
    if (!reviewId || !reviewAction) return;
    if (reviewAction === "approve") {
      approveMutation.mutate({ id: reviewId, reviewNotes: reviewNotes || null });
    } else {
      denyMutation.mutate({ id: reviewId, reviewNotes: reviewNotes || null });
    }
  }

  const pendingCount = ptoList?.filter((r) => r.pto.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UmbrellaOff className="h-6 w-6 text-blue-900" />
            PTO Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage officer time-off requests
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {pendingCount} pending
              </span>
            )}
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
          Submit Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <Select
            value={statusFilter}
            onValueChange={(v: any) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* PTO List */}
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
        ) : (ptoList?.length ?? 0) === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="py-16 text-center text-gray-400">
              <UmbrellaOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No PTO requests found</p>
            </CardContent>
          </Card>
        ) : (
          ptoList?.map(({ pto, officer }) => {
            const days =
              differenceInCalendarDays(
                new Date(pto.endDate),
                new Date(pto.startDate)
              ) + 1;
            return (
              <Card
                key={pto.id}
                className={`border-0 shadow-sm bg-white ${
                  pto.status === "pending" ? "border-l-4 border-l-amber-400" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {officer.firstName} {officer.lastName}
                        </span>
                        <span className="text-xs text-gray-400">
                          #{officer.badgeNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(pto.status)}`}
                        >
                          {statusIcon(pto.status)}
                          {pto.status}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {typeLabel(pto.type)}
                        </span>
                      </div>
                      <div className="mt-1.5 text-sm text-gray-500">
                        {format(new Date(pto.startDate), "MMM d, yyyy")} –{" "}
                        {format(new Date(pto.endDate), "MMM d, yyyy")}
                        <span className="ml-2 text-gray-400">
                          ({days} day{days !== 1 ? "s" : ""})
                        </span>
                      </div>
                      {pto.reason && (
                        <p className="mt-1 text-sm text-gray-500 italic">
                          "{pto.reason}"
                        </p>
                      )}
                      {pto.reviewNotes && (
                        <p className="mt-1 text-sm text-gray-400">
                          Review note: {pto.reviewNotes}
                        </p>
                      )}
                    </div>
                    {isAdmin && pto.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewId(pto.id);
                            setReviewAction("approve");
                            setReviewNotes("");
                          }}
                          className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewId(pto.id);
                            setReviewAction("deny");
                            setReviewNotes("");
                          }}
                          className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Submit PTO Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit PTO Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Officer *</Label>
              <Select
                value={form.officerId}
                onValueChange={(v) => setForm({ ...form, officerId: v })}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: any) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="bereavement">Bereavement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
                placeholder="Brief description..."
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
                  officerId: parseInt(form.officerId),
                  startDate: form.startDate,
                  endDate: form.endDate,
                  type: form.type,
                  reason: form.reason || null,
                })
              }
              disabled={
                !form.officerId ||
                !form.startDate ||
                !form.endDate ||
                createMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewId !== null}
        onOpenChange={(o) => !o && setReviewId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Deny"} PTO Request
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label>Review Notes (optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                placeholder="Add a note for the officer..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={approveMutation.isPending || denyMutation.isPending}
              className={
                reviewAction === "approve"
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {approveMutation.isPending || denyMutation.isPending
                ? "Processing..."
                : reviewAction === "approve"
                ? "Confirm Approval"
                : "Confirm Denial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

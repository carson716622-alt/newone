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
import { Clock, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

type OTForm = {
  officerId: string;
  weekStartDate: string;
  regularHours: number;
  overtimeHours: number;
  notes: string;
};

const defaultForm: OTForm = {
  officerId: "",
  weekStartDate: "",
  regularHours: 40,
  overtimeHours: 0,
  notes: "",
};

export default function Overtime() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OTForm>(defaultForm);

  const utils = trpc.useUtils();

  const { data: summary, isLoading: summaryLoading } =
    trpc.dashboard.overtime.summary.useQuery();
  const { data: records, isLoading: recordsLoading } =
    trpc.dashboard.overtime.list.useQuery({});
  const { data: officers } = trpc.officers.list.useQuery({ status: "active" });

  const createMutation = trpc.dashboard.overtime.create.useMutation({
    onSuccess: () => {
      utils.dashboard.overtime.list.invalidate();
      utils.dashboard.overtime.summary.invalidate();
      setShowForm(false);
      setForm(defaultForm);
      toast.success("Overtime record added");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-900" />
            Overtime Tracking
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor officer hours and overtime
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setForm(defaultForm);
              setShowForm(true);
            }}
            className="bg-blue-900 hover:bg-blue-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Hours
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Officer Summary
        </h2>
        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (summary?.length ?? 0) === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="py-10 text-center text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No overtime records yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary?.map((row) => (
              <Card key={row.officer.id} className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {row.officer.firstName} {row.officer.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        #{row.officer.badgeNumber} · {row.officer.rank}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">
                          {Number(row.totalRegular ?? 0).toFixed(1)}
                        </span>{" "}
                        reg hrs
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          Number(row.totalOvertime ?? 0) > 0
                            ? "text-amber-600"
                            : "text-gray-400"
                        }`}
                      >
                        {Number(row.totalOvertime ?? 0).toFixed(1)} OT hrs
                      </p>
                    </div>
                  </div>
                  {Number(row.totalOvertime ?? 0) > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(row.totalOvertime ?? 0) /
                                (Number(row.totalRegular ?? 1) +
                                  Number(row.totalOvertime ?? 0))) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {(
                          (Number(row.totalOvertime ?? 0) /
                            (Number(row.totalRegular ?? 1) +
                              Number(row.totalOvertime ?? 0))) *
                          100
                        ).toFixed(0)}
                        % overtime
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Records Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            Recent Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recordsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (records?.length ?? 0) === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Officer
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Week Starting
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Regular Hrs
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Overtime Hrs
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records?.map(({ record, officer }) => (
                    <tr
                      key={record.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {officer.firstName} {officer.lastName}
                        <span className="text-xs text-gray-400 ml-1">
                          #{officer.badgeNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(record.weekStartDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(record.regularHours).toFixed(1)}h
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          Number(record.overtimeHours) > 0
                            ? "text-amber-600"
                            : "text-gray-400"
                        }`}
                      >
                        {Number(record.overtimeHours).toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {record.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Hours Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Officer Hours</DialogTitle>
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
            <div className="space-y-1.5">
              <Label>Week Starting (Monday) *</Label>
              <Input
                type="date"
                value={form.weekStartDate}
                onChange={(e) =>
                  setForm({ ...form, weekStartDate: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Regular Hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={168}
                  step={0.5}
                  value={form.regularHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      regularHours: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Overtime Hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={168}
                  step={0.5}
                  value={form.overtimeHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      overtimeHours: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
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
                  weekStartDate: form.weekStartDate,
                  regularHours: form.regularHours,
                  overtimeHours: form.overtimeHours,
                  notes: form.notes || null,
                })
              }
              disabled={
                !form.officerId ||
                !form.weekStartDate ||
                createMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {createMutation.isPending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

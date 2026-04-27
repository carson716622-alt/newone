import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REPORT_TYPE_LABELS: Record<string, string> = {
  arrest: "Arrest Report",
  citation: "Citation",
  patient_care: "Patient Care Report",
  fire_incident: "Fire Incident Report",
};

export default function Reports() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { data: reports, refetch } = trpc.reports.list.useQuery({ type: typeFilter === "all" ? undefined : typeFilter });
  const createReport = trpc.reports.create.useMutation({
    onSuccess: (data) => { refetch(); setShowForm(false); toast.success(`Report filed: ${data.caseNumber}`); },
  });

  const [form, setForm] = useState({ type: "arrest" as string, title: "", narrative: "", charges: "", location: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-foreground" />
              Incident Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">File and manage incident reports with automatic case numbers</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> New Report</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>File Report</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Report Type *</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arrest">Arrest Report</SelectItem>
                        <SelectItem value="citation">Citation</SelectItem>
                        <SelectItem value="patient_care">Patient Care Report</SelectItem>
                        <SelectItem value="fire_incident">Fire Incident Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" placeholder="Brief description of incident" /></div>
                {(form.type === "arrest" || form.type === "citation") && (
                  <div><Label>Charges</Label><Textarea value={form.charges} onChange={e => setForm(f => ({ ...f, charges: e.target.value }))} className="mt-1" rows={2} placeholder="List charges..." /></div>
                )}
                <div><Label>Narrative *</Label><Textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} className="mt-1" rows={5} placeholder="Detailed account of the incident..." /></div>
                <Button onClick={() => createReport.mutate({ ...form, type: form.type as any, charges: form.charges || undefined, location: form.location || undefined })} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createReport.isPending}>
                  {createReport.isPending ? "Filing..." : "Submit Report"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "arrest", "citation", "patient_care", "fire_incident"].map(t => (
            <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)} className={typeFilter === t ? "bg-blue-600 text-white" : ""}>
              {t === "all" ? "All" : REPORT_TYPE_LABELS[t]}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        {!reports || reports.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No reports found</p>
              <p className="text-xs mt-1">Use the "New Report" button to file a report</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {reports.map(report => (
              <Card key={report.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          {REPORT_TYPE_LABELS[report.type] || report.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground data-field">{report.caseNumber}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{report.title}</h3>
                      {report.charges && <p className="text-sm text-muted-foreground mt-1">Charges: {report.charges}</p>}
                      {report.location && <p className="text-xs text-muted-foreground mt-1">Location: {report.location}</p>}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{report.narrative}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground data-field">{new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant={report.status === "approved" ? "default" : report.status === "submitted" ? "secondary" : "outline"} className="text-[10px] shrink-0">
                      {report.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

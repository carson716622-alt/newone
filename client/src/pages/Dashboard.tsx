import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase, FileText, MapPin, Clock, CheckCircle2, AlertCircle, Plus,
  Eye, Search, Shield, Loader2, Users, Star, XCircle, ArrowLeft,
  ChevronRight, Upload, Trash2, Download, User, Calendar, DollarSign,
  ExternalLink, Building2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ── Status pipeline config ─────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; cls: string; Icon: any }> = {
  applied:     { label: "Applied",     cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",     Icon: Clock },
  reviewing:   { label: "Reviewing",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", Icon: Eye },
  shortlisted: { label: "Shortlisted", cls: "bg-green-500/10 text-green-400 border-green-500/20",  Icon: Star },
  rejected:    { label: "Rejected",    cls: "bg-red-500/10 text-red-400 border-red-500/20",        Icon: XCircle },
  offered:     { label: "Offered",     cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", Icon: CheckCircle2 },
  accepted:    { label: "Accepted",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", Icon: CheckCircle2 },
};

type View = "overview" | "applications" | "candidate";

export default function Dashboard() {
  const { session } = useAuth();
  const agencyId = session?.agencyId;

  /* navigation state */
  const [view, setView] = useState<View>("overview");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  /* post‑job dialog */
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  /* data */
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } =
    trpc.jobs.getByAgency.useQuery({ agencyId: agencyId || 0 }, { enabled: !!agencyId, staleTime: 10_000 });

  if (!agencyId) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Agency Not Found</h1>
          <p className="text-muted-foreground">Please log in as an agency to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {view === "overview" && (
          <OverviewSection
            agencyId={agencyId}
            jobs={jobs || []}
            jobsLoading={jobsLoading}
            refetchJobs={refetchJobs}
            isPostJobOpen={isPostJobOpen}
            setIsPostJobOpen={setIsPostJobOpen}
            onSelectJob={(id) => { setSelectedJobId(id); setView("applications"); }}
          />
        )}
        {view === "applications" && selectedJobId && (
          <ApplicationsSection
            jobId={selectedJobId}
            onBack={() => setView("overview")}
            onViewCandidate={(id) => { setSelectedCandidateId(id); setView("candidate"); }}
          />
        )}
        {view === "candidate" && selectedCandidateId && (
          <CandidateSection
            candidateId={selectedCandidateId}
            onBack={() => setView("applications")}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================
   OVERVIEW — stats + job list + post‑job dialog
   ================================================================ */
function OverviewSection({
  agencyId, jobs, jobsLoading, refetchJobs, isPostJobOpen, setIsPostJobOpen, onSelectJob,
}: {
  agencyId: number; jobs: any[]; jobsLoading: boolean; refetchJobs: () => void;
  isPostJobOpen: boolean; setIsPostJobOpen: (v: boolean) => void;
  onSelectJob: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = jobs.filter((j: any) =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const approved = jobs.filter((j: any) => j.status === "approved").length;
  const pending  = jobs.filter((j: any) => j.status === "pending").length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Agency Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your job postings and review applications</p>
            </div>
          </div>
        </div>
        <PostJobDialog
          agencyId={agencyId}
          open={isPostJobOpen}
          onOpenChange={setIsPostJobOpen}
          onCreated={refetchJobs}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Briefcase} iconCls="text-primary bg-primary/10" label="TOTAL POSTINGS" value={jobs.length} />
        <StatCard icon={CheckCircle2} iconCls="text-green-500 bg-green-500/10" label="ACTIVE JOBS" value={approved} />
        <StatCard icon={Clock} iconCls="text-yellow-500 bg-yellow-500/10" label="PENDING REVIEW" value={pending} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search job postings..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-white/10" />
      </div>

      {/* Job list */}
      {jobsLoading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/50 border-white/5">
          <CardContent className="py-16 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-white mb-2">No Job Postings Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first job posting to start receiving applications.</p>
            <Button className="bg-primary" onClick={() => setIsPostJobOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job: any) => (
            <Card key={job.id}
              className="bg-card/50 border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => onSelectJob(job.id)}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    job.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    job.status === "pending"  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }>{job.status}</Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ── tiny stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, iconCls, label, value }: { icon: any; iconCls: string; label: string; value: number }) {
  return (
    <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
      <CardContent className="p-6 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconCls.split(" ").pop()}`}>
          <Icon className={`h-5 w-5 ${iconCls.split(" ").shift()}`} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   POST JOB DIALOG
   ================================================================ */
function PostJobDialog({ agencyId, open, onOpenChange, onCreated }: {
  agencyId: number; open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMut = trpc.jobs.create.useMutation({
    onSuccess: async (data: any) => {
      /* upload application form PDF if provided */
      if (pdfFile && data?.id) {
        try {
          const fd = new FormData();
          fd.append("file", pdfFile);
          const res = await fetch("/api/upload/application-forms", { method: "POST", body: fd });
          if (res.ok) {
            const d = await res.json();
            await uploadFormMut.mutateAsync({ jobId: data.id, formUrl: d.url, formFileName: d.fileName });
          }
        } catch { /* best effort */ }
      }
      toast.success("Job posted successfully! Pending admin review.");
      resetForm();
      onOpenChange(false);
      onCreated();
    },
    onError: () => toast.error("Failed to create job posting."),
  });

  const uploadFormMut = trpc.applications.uploadForm.useMutation();

  const resetForm = () => {
    setTitle(""); setLocation(""); setSalary(""); setJobType("Full-time");
    setDescription(""); setRequirements(""); setPdfFile(null);
  };

  const handleSubmit = () => {
    if (!title || !description || !location) { toast.error("Please fill in all required fields."); return; }
    createMut.mutate({ agencyId, title, description, location, salary: salary || undefined, jobType: jobType || undefined, requirements: requirements || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Plus className="mr-2 h-4 w-4" /> Post New Opening
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 gap-0 bg-[#0f172a] border-white/10">
        <DialogHeader className="p-6 border-b border-white/10">
          <DialogTitle className="text-2xl text-white">Post a New Opening</DialogTitle>
          <DialogDescription>Fill in the details below. The listing will be reviewed by an admin before going live.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-160px)]">
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Job Title *" value={title} onChange={setTitle} placeholder="e.g. Police Officer" />
              <Field label="Location *" value={location} onChange={setLocation} placeholder="e.g. Chicago, IL" />
              <Field label="Salary Range" value={salary} onChange={setSalary} placeholder="e.g. $55,000 – $75,000" />
              <div className="space-y-2">
                <Label className="text-white">Job Type</Label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-10 rounded-md border border-white/10 bg-background/50 px-3 text-sm text-white">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Seasonal">Seasonal</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Job Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the position, responsibilities, and what makes this opportunity great..."
                className="bg-background/50 border-white/10 min-h-[120px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Requirements</Label>
              <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="List qualifications, certifications, and experience required..."
                className="bg-background/50 border-white/10 min-h-[80px]" />
            </div>

            <Separator className="bg-white/5" />

            {/* PDF upload */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Application Form (PDF) — Optional
              </Label>
              <p className="text-xs text-muted-foreground">Upload your department's official application form. Candidates can download and fill it out on the site.</p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]); }} />
              {pdfFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-primary flex-1 truncate">{pdfFile.name}</span>
                  <span className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <Button variant="ghost" size="sm" onClick={() => setPdfFile(null)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="border-dashed border-white/20 hover:bg-white/5 w-full h-14"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Upload Application Form (PDF)</span>
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t border-white/10">
          <Button variant="outline" className="border-white/10" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMut.isLoading} className="bg-primary hover:bg-primary/90 text-white">
            {createMut.isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Post Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-white">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="bg-background/50 border-white/10" />
    </div>
  );
}

/* ================================================================
   APPLICATIONS — view all applications for a job
   ================================================================ */
function ApplicationsSection({ jobId, onBack, onViewCandidate }: {
  jobId: number; onBack: () => void; onViewCandidate: (id: number) => void;
}) {
  const [filter, setFilter] = useState("all");
  const { data: job } = trpc.jobs.getById.useQuery({ id: jobId });
  const { data: apps, isLoading, refetch } = trpc.applications.getByJob.useQuery({ jobId }, { staleTime: 5000 });
  const { data: form } = trpc.applications.getForm.useQuery({ jobId });

  const updateMut = trpc.applications.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated."); },
    onError: () => toast.error("Failed to update status."),
  });

  const list = (apps || []).filter((a: any) => filter === "all" || a.status === filter);
  const counts: Record<string, number> = {};
  (apps || []).forEach((a: any) => { counts[a.status] = (counts[a.status] || 0) + 1; });

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{job?.title || "Job Applications"}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {job?.location}
          </p>
        </div>
        {form?.formUrl && (
          <Button variant="outline" className="border-white/10" onClick={() => window.open(form.formUrl, "_blank")}>
            <Download className="w-4 h-4 mr-2" /> View Application Form
          </Button>
        )}
      </div>

      {/* Pipeline filter */}
      <div className="flex gap-2 flex-wrap">
        <PillBtn active={filter === "all"} onClick={() => setFilter("all")}>All ({(apps || []).length})</PillBtn>
        {Object.entries(STATUS_CFG).map(([k, c]) => (
          <PillBtn key={k} active={filter === k} onClick={() => setFilter(k)}>{c.label} ({counts[k] || 0})</PillBtn>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" /></div>
      ) : list.length === 0 ? (
        <Card className="bg-card/50 border-white/5">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-white mb-2">No Applications</h3>
            <p className="text-muted-foreground">{filter === "all" ? "No candidates have applied yet." : `No "${filter}" applications.`}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((app: any) => {
            const s = STATUS_CFG[app.status] || STATUS_CFG.applied;
            return (
              <Card key={app.id} className="bg-card/50 border-white/5">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">
                          {app.candidateName || `Candidate #${app.candidateId}`}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Applied {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "Recently"}
                          </span>
                          {app.submissionFileName && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {app.submissionFileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={s.cls}><s.Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                      {app.submissionUrl && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white"
                          onClick={() => window.open(app.submissionUrl, "_blank")} title="Download Application">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"
                        onClick={() => onViewCandidate(app.candidateId)} title="View Profile">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="pt-3 border-t border-white/5 flex gap-2 flex-wrap items-center">
                    <span className="text-xs text-muted-foreground mr-1">Move to:</span>
                    {Object.entries(STATUS_CFG).filter(([k]) => k !== app.status).map(([k, c]) => (
                      <Button key={k} variant="outline" size="sm" className="border-white/10 text-xs h-7"
                        onClick={() => updateMut.mutate({ submissionId: app.id, status: k as any })}>
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm"
      className={active ? "bg-primary" : "border-white/10"} onClick={onClick}>
      {children}
    </Button>
  );
}

/* ================================================================
   CANDIDATE PROFILE — view a candidate's full profile
   ================================================================ */
function CandidateSection({ candidateId, onBack }: { candidateId: number; onBack: () => void }) {
  const { data: profile, isLoading } = trpc.profiles.getCandidateProfileById.useQuery(
    { candidateId }, { staleTime: 10_000 }
  );

  if (isLoading) return (
    <div className="text-center py-20"><Loader2 className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" /><p className="text-muted-foreground">Loading profile…</p></div>
  );

  if (!profile) return (
    <div className="text-center py-20">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
      <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
      <p className="text-muted-foreground mb-4">This candidate hasn't set up their profile yet.</p>
      <Button variant="outline" className="border-white/10" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Applications
      </Button>

      {/* Header */}
      <Card className="bg-card/50 border-white/5">
        <CardContent className="p-6 flex items-center gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {profile.profilePicture
              ? <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-primary" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile.firstName} {profile.lastName}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            {profile.bio && <p className="text-sm text-muted-foreground mt-2 max-w-lg">{profile.bio}</p>}
          </div>
          {profile.resumeUrl && (
            <Button variant="outline" className="border-white/10" onClick={() => window.open(profile.resumeUrl, "_blank")}>
              <Download className="w-4 h-4 mr-2" /> Resume
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      {profile.skills && (
        <Card className="bg-card/50 border-white/5">
          <CardHeader><CardTitle className="text-white">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(",").map((s: string, i: number) => (
                <Badge key={i} className="bg-primary/10 text-primary border-primary/20">{s.trim()}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {profile.experience?.length > 0 && (
        <Card className="bg-card/50 border-white/5">
          <CardHeader><CardTitle className="text-white">Work Experience</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {profile.experience.map((e: any, i: number) => (
              <div key={i} className="border-l-2 border-primary/30 pl-4">
                <h3 className="text-white font-semibold">{e.jobTitle}</h3>
                <p className="text-muted-foreground text-sm">{e.department}</p>
                {e.location && <p className="text-muted-foreground text-xs">{e.location}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {e.startDate ? new Date(e.startDate).toLocaleDateString() : ""} — {e.isCurrentPosition ? "Present" : e.endDate ? new Date(e.endDate).toLocaleDateString() : ""}
                </p>
                {e.description && <p className="text-sm text-muted-foreground mt-2">{e.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {profile.certifications?.length > 0 && (
        <Card className="bg-card/50 border-white/5">
          <CardHeader><CardTitle className="text-white">Certifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {profile.certifications.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-white font-medium">{c.certificationName}</h4>
                  <p className="text-xs text-muted-foreground">{c.issuingOrganization}</p>
                </div>
                {c.certificateUrl && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(c.certificateUrl, "_blank")}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

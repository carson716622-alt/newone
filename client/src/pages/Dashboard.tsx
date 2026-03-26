import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import RichTextEditor from "@/components/RichTextEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase, FileText, MapPin, Clock, CheckCircle2, AlertCircle, Plus,
  Eye, Search, Shield, Loader2, Users, Star, XCircle, ArrowLeft,
  ChevronRight, Upload, Trash2, Download, User, Calendar, DollarSign,
  ExternalLink, Building2, Globe, Link2, GraduationCap, ClipboardList,
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

/* ── US States ─────────────────────────────────────────────── */
const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

type View = "overview" | "applications" | "candidate";

export default function Dashboard() {
  const { session } = useAuth();
  const agencyId = session?.agencyId;

  /* navigation state */
  const [view, setView] = useState<View>("overview");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  /* post-job dialog */
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
   OVERVIEW — stats + job list + post-job dialog
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
  const pending  = jobs.filter((j: any) => j.status === "pending_approval").length;

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
                    job.status === "pending_approval"  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }>{job.status === "pending_approval" ? "Pending" : job.status}</Badge>
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
   POST JOB DIALOG — Full detailed form with all fields
   ================================================================ */
function PostJobDialog({ agencyId, open, onOpenChange, onCreated }: {
  agencyId: number; open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    jobTitle: "",
    city: "",
    state: "",
    zip: "",
    employmentType: "Full-time",
    roleCategory: "Police",
    overview: "",
    requirements: "",
    preferredQualifications: "",
    education: {
      highSchool: false,
      credits60: false,
      associate: false,
      bachelor: false,
      powerCard: false,
    },
    deadline: "",
    salary: "",
    applyLink: "",
    website: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Custom document requirements */
  const [docRequirements, setDocRequirements] = useState<{ title: string; description: string; isRequired: boolean }[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");

  const addDocRequirement = () => {
    const title = newDocTitle.trim();
    if (!title) return;
    if (docRequirements.some(d => d.title.toLowerCase() === title.toLowerCase())) {
      toast.error("This document title already exists.");
      return;
    }
    setDocRequirements(prev => [...prev, { title, description: "", isRequired: true }]);
    setNewDocTitle("");
  };

  const removeDocRequirement = (index: number) => {
    setDocRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDocRequired = (index: number) => {
    setDocRequirements(prev => prev.map((d, i) => i === index ? { ...d, isRequired: !d.isRequired } : d));
  };

  const updateDocDescription = (index: number, desc: string) => {
    setDocRequirements(prev => prev.map((d, i) => i === index ? { ...d, description: desc } : d));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const toggleEducation = (key: keyof typeof formData.education) => {
    setFormData(prev => ({
      ...prev,
      education: { ...prev.education, [key]: !prev.education[key] }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.overview.trim() || formData.overview.replace(/<[^>]*>/g, '').trim().length < 20)
      newErrors.overview = "Position overview is required (at least 20 characters)";
    if (!formData.deadline.trim()) newErrors.deadline = "Application deadline is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMut = trpc.jobs.create.useMutation({
    onSuccess: async (data: any) => {
      /* upload application form PDF if provided */
      if (pdfFile && data?.jobId) {
        try {
          const fd = new FormData();
          fd.append("file", pdfFile);
          const res = await fetch("/api/upload/application-forms", { method: "POST", body: fd });
          if (res.ok) {
            const d = await res.json();
            await uploadFormMut.mutateAsync({ jobId: data.jobId, formUrl: d.url, formFileName: d.fileName });
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
    setFormData({
      jobTitle: "", city: "", state: "", zip: "",
      employmentType: "Full-time", roleCategory: "Police",
      overview: "", requirements: "", preferredQualifications: "",
      education: { highSchool: false, credits60: false, associate: false, bachelor: false, powerCard: false },
      deadline: "", salary: "", applyLink: "", website: "",
    });
    setPdfFile(null);
    setDocRequirements([]);
    setNewDocTitle("");
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    const location = `${formData.city}, ${formData.state}${formData.zip ? ` ${formData.zip}` : ''}`;
    const deadline = formData.deadline ? new Date(formData.deadline) : undefined;

    // Build a rich description that includes all the extra fields
    let fullDescription = formData.overview;

    // Append preferred qualifications into description if provided
    if (formData.preferredQualifications.trim()) {
      fullDescription += `\n\n<h3>Preferred Qualifications</h3>\n${formData.preferredQualifications}`;
    }

    // Append education requirements
    const eduLabels: string[] = [];
    if (formData.education.highSchool) eduLabels.push("High school diploma / GED");
    if (formData.education.credits60) eduLabels.push("60+ credit hours");
    if (formData.education.associate) eduLabels.push("Associate's degree");
    if (formData.education.bachelor) eduLabels.push("Bachelor's degree");
    if (formData.education.powerCard) eduLabels.push("Valid POWER card");
    if (eduLabels.length > 0) {
      fullDescription += `\n\n<h3>Minimum Education / Eligibility</h3>\n<ul>${eduLabels.map(e => `<li>${e}</li>`).join('')}</ul>`;
    }

    // Append links
    if (formData.applyLink.trim()) {
      fullDescription += `\n\n<h3>How to Apply</h3>\n<p>Apply online: <a href="${formData.applyLink}" target="_blank">${formData.applyLink}</a></p>`;
    }
    if (formData.website.trim()) {
      fullDescription += `\n\n<p>Department website: <a href="${formData.website}" target="_blank">${formData.website}</a></p>`;
    }

    createMut.mutate({
      agencyId,
      title: formData.jobTitle,
      description: fullDescription,
      location,
      salary: formData.salary || undefined,
      jobType: `${formData.employmentType} — ${formData.roleCategory}`,
      requirements: formData.requirements || undefined,
      deadline: deadline || null,
      documentRequirements: docRequirements.length > 0
        ? docRequirements.map((d, i) => ({ title: d.title, description: d.description || undefined, isRequired: d.isRequired, sortOrder: i }))
        : undefined,
    });
  };

  /* ── Section header helper ── */
  const SectionHeader = ({ icon: SIcon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 pt-2">
      <div className="p-1.5 rounded-md bg-primary/10">
        <SIcon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Plus className="mr-2 h-4 w-4" /> Post New Opening
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-4xl h-[90vh] p-0 gap-0 bg-[#0f172a] border-white/10 flex flex-col overflow-hidden" showCloseButton={false}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-white">Post a New Opening</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the details below — the listing will be reviewed by an admin before going live.
            </DialogDescription>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm p-1 opacity-70 hover:opacity-100 transition-opacity text-muted-foreground hover:text-white mt-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-6">

            {/* ─── SECTION 1: Basic Info ─── */}
            <SectionHeader icon={Briefcase} title="Basic Information" subtitle="Job title, location, and type" />

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-white">Job Title <span className="text-red-400">*</span></Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => updateField("jobTitle", e.target.value)}
                placeholder="e.g. Police Officer (Entry-Level)"
                className={`bg-background/50 border-white/10 ${errors.jobTitle ? "border-red-500" : ""}`}
              />
              {errors.jobTitle && <p className="text-xs text-red-400">{errors.jobTitle}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-white">City <span className="text-red-400">*</span></Label>
                <LocationAutocomplete
                  value={formData.city}
                  onChange={(val) => updateField("city", val)}
                  onSelect={(city, state, zip) => {
                    setFormData(prev => ({
                      ...prev,
                      city,
                      state: state.toUpperCase(),
                      zip: zip || prev.zip,
                    }));
                  }}
                  className={`bg-background/50 border-white/10 ${errors.city ? "border-red-500" : ""}`}
                  error={!!errors.city}
                />
                {errors.city && <p className="text-xs text-red-400">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-white">State <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.state}
                  onValueChange={(val) => updateField("state", val)}
                >
                  <SelectTrigger className={`bg-background/50 border-white/10 ${errors.state ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {US_STATES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-xs text-red-400">{errors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-white">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                  placeholder="ZIP code"
                  className="bg-background/50 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(val) => updateField("employmentType", val)}
                >
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Reserve">Reserve</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Role Category</Label>
                <Select
                  value={formData.roleCategory}
                  onValueChange={(val) => updateField("roleCategory", val)}
                >
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Police">Police</SelectItem>
                    <SelectItem value="Sheriff">Sheriff</SelectItem>
                    <SelectItem value="Dispatch">Dispatch</SelectItem>
                    <SelectItem value="Corrections">Corrections</SelectItem>
                    <SelectItem value="Federal">Federal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 2: Description ─── */}
            <SectionHeader icon={FileText} title="Position Details" subtitle="Describe the role and what makes your department unique" />

            <div className="space-y-2">
              <Label className="text-white">Position Overview / Description <span className="text-red-400">*</span></Label>
              <RichTextEditor
                value={formData.overview}
                onChange={(val) => updateField("overview", val)}
                placeholder="Summarize the role, schedule, and what makes this department unique."
                minHeight="150px"
              />
              {errors.overview && <p className="text-xs text-red-400">{errors.overview}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-white">Requirements (experience, certifications, etc.)</Label>
              <RichTextEditor
                value={formData.requirements}
                onChange={(val) => updateField("requirements", val)}
                placeholder="Minimum age, education, POST certification, lateral criteria, etc."
                minHeight="120px"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 3: Education & Qualifications ─── */}
            <SectionHeader icon={GraduationCap} title="Education & Qualifications" subtitle="Minimum education and preferred qualifications" />

            <div className="space-y-3">
              <Label className="text-white text-sm">Minimum Education / Eligibility</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: "highSchool" as const, label: "High school diploma / GED" },
                  { key: "credits60" as const, label: "60+ credit hours" },
                  { key: "associate" as const, label: "Associate's degree" },
                  { key: "bachelor" as const, label: "Bachelor's degree" },
                  { key: "powerCard" as const, label: "Valid POWER card" },
                ].map(item => (
                  <div key={item.key} className="flex items-center space-x-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                    <Checkbox
                      id={item.key}
                      checked={formData.education[item.key]}
                      onCheckedChange={() => toggleEducation(item.key)}
                      className="border-white/20"
                    />
                    <label htmlFor={item.key} className="text-sm text-muted-foreground cursor-pointer">{item.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Preferred Qualifications (nice-to-haves)</Label>
              <Textarea
                value={formData.preferredQualifications}
                onChange={(e) => updateField("preferredQualifications", e.target.value)}
                placeholder="Language skills, specialty units, bachelor's degree preferred, etc."
                className="bg-background/50 border-white/10 min-h-[80px]"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 4: Compensation & Deadline ─── */}
            <SectionHeader icon={DollarSign} title="Compensation & Timeline" subtitle="Salary details and application deadline" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-white">Compensation</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => updateField("salary", e.target.value)}
                  placeholder="$62,000 starting, lateral DOE"
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-white">Applications Due By <span className="text-red-400">*</span></Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateField("deadline", e.target.value)}
                  className={`bg-background/50 border-white/10 ${errors.deadline ? "border-red-500" : ""}`}
                />
                {errors.deadline && <p className="text-xs text-red-400">{errors.deadline}</p>}
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 5: Links ─── */}
            <SectionHeader icon={Link2} title="Links & Resources" subtitle="Application URL and department website" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applyLink" className="text-white flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /> Apply Link (URL)
                </Label>
                <Input
                  id="applyLink"
                  value={formData.applyLink}
                  onChange={(e) => updateField("applyLink", e.target.value)}
                  placeholder="https://your-agency.gov/jobs/apply"
                  className="bg-background/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Department Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://your-agency.gov"
                  className="bg-background/50 border-white/10"
                />
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 6: Required Documents ─── */}
            <SectionHeader icon={ClipboardList} title="Required Documents for Candidates" subtitle="Define what documents candidates must upload when applying" />

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Add custom document titles that candidates will be asked to upload. For example: "Background Check Authorization", "Physical Fitness Test Results", "POST Certificate", etc.
              </p>

              {/* Existing requirements */}
              {docRequirements.length > 0 && (
                <div className="space-y-2">
                  {docRequirements.map((doc, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-white font-medium">{doc.title}</span>
                          <Badge variant="outline" className={doc.isRequired ? "border-red-500/30 text-red-400 text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}>
                            {doc.isRequired ? "Required" : "Optional"}
                          </Badge>
                        </div>
                        <Input
                          value={doc.description}
                          onChange={(e) => updateDocDescription(index, e.target.value)}
                          placeholder="Instructions for this document (optional)"
                          className="bg-background/50 border-white/10 text-xs h-8"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDocRequired(index)}
                          className="text-xs text-muted-foreground hover:text-white h-7 px-2"
                        >
                          {doc.isRequired ? "Make Optional" : "Make Required"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocRequirement(index)}
                          className="text-red-400 hover:text-red-300 h-7 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new requirement */}
              <div className="flex items-center gap-2">
                <Input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDocRequirement(); } }}
                  placeholder="Enter document title (e.g., Background Check Authorization)"
                  className="bg-background/50 border-white/10 flex-1"
                />
                <Button
                  variant="outline"
                  onClick={addDocRequirement}
                  disabled={!newDocTitle.trim()}
                  className="border-white/10 hover:bg-white/5 shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {/* Quick-add presets */}
              {docRequirements.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Quick add common documents:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Resume / CV", "Cover Letter", "POST Certificate", "Background Check Authorization", "Physical Fitness Test Results", "College Transcripts", "DD-214 (Military)", "Driver's License Copy"].map(preset => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/5 h-7"
                        onClick={() => {
                          if (!docRequirements.some(d => d.title === preset)) {
                            setDocRequirements(prev => [...prev, { title: preset, description: "", isRequired: true }]);
                          }
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> {preset}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-white/5" />

            {/* ─── SECTION 7: Application Form Upload ─── */}
            <SectionHeader icon={Upload} title="Application Form" subtitle="Upload your department's official application form" />

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Application Form (PDF/DOC)
              </Label>
              <p className="text-xs text-muted-foreground">Upload the application form candidates will download and submit. Accepted formats: PDF, DOC, DOCX.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setPdfFile(e.target.files[0]); }}
              />
              {pdfFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-primary flex-1 truncate text-sm">{pdfFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <Button variant="ghost" size="sm" onClick={() => setPdfFile(null)} className="text-red-400 hover:text-red-300 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-dashed border-white/20 hover:bg-white/5 w-full h-16"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Click to upload application form</span>
                </Button>
              )}
            </div>

          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0f172a] shrink-0">
          <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMut.isLoading}
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            {createMut.isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" />Post Job</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
    <div className="text-center py-20"><Loader2 className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" /><p className="text-muted-foreground">Loading profile...</p></div>
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

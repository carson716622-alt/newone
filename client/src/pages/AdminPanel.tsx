import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MapPin, 
  Clock, 
  Shield, 
  ExternalLink,
  Building2,
  FileText,
  Search,
  Filter,
  Mail,
  Star,
  Loader2,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminPanel() {
  const { user } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  // Fetch jobs from the real database via tRPC
  const { data: pendingJobs = [], isLoading: pendingLoading, refetch: refetchPending } = trpc.jobs.getPending.useQuery();
  const { data: approvedJobs = [], isLoading: approvedLoading, refetch: refetchApproved } = trpc.jobs.getApproved.useQuery();
  const { data: agencies = [] } = trpc.jobs.getAgencies.useQuery();

  // Mutations
  const approveMut = trpc.jobs.approve.useMutation({
    onSuccess: () => {
      toast.success("Job approved successfully!");
      refetchPending();
      refetchApproved();
      setSelectedJobId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to approve job"),
  });

  const rejectMut = trpc.jobs.reject.useMutation({
    onSuccess: () => {
      toast.success("Job rejected.");
      refetchPending();
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedJobId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to reject job"),
  });

  const toggleFeaturedMut = trpc.jobs.toggleFeatured.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isFeatured ? "Job marked as featured!" : "Job removed from featured");
      refetchApproved();
    },
    onError: (err) => toast.error(err.message || "Failed to toggle featured"),
  });

  const deleteMut = trpc.jobs.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted.");
      refetchPending();
      refetchApproved();
      setSelectedJobId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete job"),
  });

  // Helper: get agency name by ID
  const getAgencyName = (agencyId: number) => {
    const agency = (agencies as any[]).find((a: any) => a.id === agencyId);
    return agency?.departmentName || `Agency #${agencyId}`;
  };

  const currentJobs = activeTab === 'pending' ? pendingJobs : approvedJobs;
  const selectedJob = (currentJobs as any[]).find((j: any) => j.id === selectedJobId) || null;
  const isLoading = pendingLoading || approvedLoading;

  const handleApprove = (job: any) => {
    approveMut.mutate({ jobId: job.id, adminId: user?.id || 1 });
  };

  const handleReject = () => {
    if (!selectedJob) return;
    rejectMut.mutate({ jobId: selectedJob.id });
  };

  const handleToggleFeatured = (job: any) => {
    toggleFeaturedMut.mutate({ jobId: job.id, isFeatured: !job.isFeatured });
  };

  const handleDelete = (job: any) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) return;
    deleteMut.mutate({ jobId: job.id });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="container py-10 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-5 duration-500">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">
              Admin <span className="text-primary">Review Panel</span>
            </h1>
            <p className="text-muted-foreground">
              Vet and manage incoming job submissions.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-sm">
            {pendingJobs.length} Pending Reviews
          </Badge>
          <Badge variant="outline" className="px-4 py-2 bg-blue-500/10 text-blue-500 border-blue-500/20 text-sm">
            {approvedJobs.length} Approved
          </Badge>
        </div>
      </div>

      {/* Tabs for Pending and Approved */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'pending' | 'approved'); setSelectedJobId(null); }} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-background border border-white/5">
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20">
            Pending Review ({pendingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-primary/20">
            Approved Jobs ({approvedJobs.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List of Jobs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">
              {activeTab === 'pending' ? 'Submission Queue' : 'Approved Jobs'}
            </h2>
          </div>
          
          <ScrollArea className="h-[calc(100vh-350px)] pr-4">
            <div className="space-y-3">
              {(currentJobs as any[]).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-xs">No {activeTab === 'pending' ? 'pending' : 'approved'} jobs.</p>
                </div>
              ) : (
                (currentJobs as any[]).map((job: any) => (
                  <Card 
                    key={job.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${selectedJobId === job.id ? 'border-primary bg-primary/5' : 'bg-card border-white/5'}`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={`text-[10px] ${
                            activeTab === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                              : job.isFeatured 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {activeTab === 'pending' ? 'Pending' : job.isFeatured ? 'Featured' : 'Active'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-white mb-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <Building2 className="w-3 h-3" /> {getAgencyName(job.agencyId)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.jobType}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Detail View */}
        <div className="lg:col-span-2">
          {selectedJob ? (
            <Card className="bg-card border-white/5 h-full animate-in fade-in duration-300">
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16 border border-white/10">
                      <AvatarImage src="https://d2xsxph8kpxj0f.cloudfront.net/310519663247660894/DQCU3v7X4fheix7dHiRiz7/badge-icon_ac2dbc17.png" />
                      <AvatarFallback>AG</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-white">{selectedJob.title}</h2>
                      <div className="flex items-center gap-2 text-primary font-medium mt-1">
                        <Building2 className="w-4 h-4" /> {getAgencyName(selectedJob.agencyId)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedJob.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedJob.jobType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'pending' ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                          onClick={() => setIsRejectDialogOpen(true)}
                          disabled={rejectMut.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                          onClick={() => handleApprove(selectedJob)}
                          disabled={approveMut.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> {approveMut.isPending ? "Approving..." : "Approve"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant={selectedJob?.isFeatured ? "default" : "outline"}
                          className={selectedJob?.isFeatured ? "bg-amber-600 hover:bg-amber-500" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}
                          onClick={() => handleToggleFeatured(selectedJob)}
                          disabled={toggleFeaturedMut.isPending}
                        >
                          <Star className="w-4 h-4 mr-2" fill={selectedJob?.isFeatured ? "currentColor" : "none"} /> 
                          {selectedJob?.isFeatured ? 'Unfeature' : 'Feature'}
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => handleDelete(selectedJob)}
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Salary Range</Label>
                    <p className="text-lg font-medium text-white mt-1">{selectedJob.salary || "Not specified"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Deadline</Label>
                    <p className="text-lg font-medium text-white mt-1">
                      {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString() : "No deadline"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Posted</Label>
                    <p className="text-sm font-medium text-white mt-1">
                      {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Agency ID</Label>
                    <p className="text-sm font-medium text-white mt-1">#{selectedJob.agencyId}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Position Description</Label>
                  <div className="prose prose-invert max-w-none bg-background/30 p-4 rounded-lg border border-white/5" dangerouslySetInnerHTML={{ __html: selectedJob.description }} />
                </div>

                {selectedJob.requirements && (
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Requirements</Label>
                    <div className="prose prose-invert max-w-none bg-background/30 p-4 rounded-lg border border-white/5" dangerouslySetInnerHTML={{ __html: selectedJob.requirements }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg bg-card/30 min-h-[400px]">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a job to review</p>
              <p className="text-sm">Choose a {activeTab === 'pending' ? 'pending submission' : 'job'} from the queue</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-card border-white/5">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Job Posting</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Provide a reason for rejecting this job posting. The agency will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="Enter rejection reason..." 
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="bg-background border-white/10 text-white"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-500" 
              onClick={handleReject}
              disabled={rejectMut.isPending}
            >
              {rejectMut.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

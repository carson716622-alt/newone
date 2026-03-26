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
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { notificationService, EmailLog } from "@/lib/notificationService";
import { jobService, Job } from "@/lib/jobService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminPanel() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setEmailLogs);
    loadPendingJobs();
    loadApprovedJobs();
    return () => unsubscribe();
  }, []);

  const loadPendingJobs = () => {
    const allJobs = jobService.getAllJobs();
    const pending = allJobs.filter(job => job.status === 'pending');
    setPendingJobs(pending);
    
    if (selectedJob && !pending.find(j => j.id === selectedJob.id)) {
      setSelectedJob(null);
    }
  };

  const loadApprovedJobs = () => {
    const allJobs = jobService.getAllJobs();
    const approved = allJobs.filter(job => job.status === 'active');
    setApprovedJobs(approved);
  };

  const handleApprove = async (job: Job) => {
    try {
      jobService.updateJobStatus(job.id, 'active');
      
      toast.promise(
        notificationService.sendApprovalEmail("agency@example.com", job.title),
        {
          loading: 'Approving and sending email...',
          success: 'Job approved and notification sent!',
          error: 'Failed to send notification',
        }
      );
      
      loadPendingJobs();
      loadApprovedJobs();
    } catch (error) {
      toast.error("Failed to approve job");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (!selectedJob) return;

    try {
      jobService.updateJobStatus(selectedJob.id, 'rejected', rejectionReason);

      toast.promise(
        notificationService.sendRejectionEmail("agency@example.com", selectedJob.title, rejectionReason),
        {
          loading: 'Rejecting and sending email...',
          success: 'Job rejected and notification sent!',
          error: 'Failed to send notification',
        }
      );
      
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      loadPendingJobs();
    } catch (error) {
      toast.error("Failed to reject job");
    }
  };

  const handleToggleFeatured = async (job: Job) => {
    try {
      const isFeatured = !job.isFeatured;
      jobService.updateJobFeatured(job.id, isFeatured);
      toast.success(isFeatured ? 'Job marked as featured!' : 'Job removed from featured');
      loadApprovedJobs();
    } catch (error) {
      toast.error('Failed to toggle featured status');
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      jobService.deleteJob(job.id);
      toast.success('Job deleted successfully');
      loadPendingJobs();
      loadApprovedJobs();
      setSelectedJob(null);
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const currentJobs = activeTab === 'pending' ? pendingJobs : approvedJobs;

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

      {/* Email Logs Section (For Demo/Debugging) */}
      {emailLogs.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-5 duration-500">
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" /> System Email Logs (Simulation)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="text-sm p-3 rounded bg-background/50 border border-white/5 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={log.type === 'approval' ? 'text-green-400 border-green-400/20' : 'text-red-400 border-red-400/20'}>
                            {log.type === 'approval' ? 'Approved' : 'Rejected'}
                          </Badge>
                          <span className="font-bold text-white">{log.subject}</span>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-1">{log.body}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Pending and Approved */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'approved')} className="mb-6">
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
              {activeTab === 'pending' ? 'Submission Queue' : 'Featured Management'}
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-350px)] pr-4">
            <div className="space-y-3">
              {currentJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>All caught up!</p>
                  <p className="text-xs">No {activeTab === 'pending' ? 'pending' : 'approved'} jobs.</p>
                </div>
              ) : (
                currentJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${selectedJob?.id === job.id ? 'border-primary bg-primary/5' : 'bg-card border-white/5'}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={`text-[10px] ${activeTab === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : job.isFeatured ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {activeTab === 'pending' ? 'Pending' : job.isFeatured ? 'Featured' : 'Active'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{job.postedDate}</span>
                      </div>
                      <h3 className="font-bold text-white mb-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <Building2 className="w-3 h-3" /> {job.department}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.city}, {job.state}</span>
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
                        <Building2 className="w-4 h-4" /> {selectedJob.department}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedJob.city}, {selectedJob.state}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedJob.type}</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {selectedJob.category}</span>
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
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                          onClick={() => handleApprove(selectedJob)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant={selectedJob?.isFeatured ? "default" : "outline"}
                        className={selectedJob?.isFeatured ? "bg-amber-600 hover:bg-amber-500" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}
                        onClick={() => handleToggleFeatured(selectedJob)}
                      >
                        <Star className="w-4 h-4 mr-2" fill={selectedJob?.isFeatured ? "currentColor" : "none"} /> 
                        {selectedJob?.isFeatured ? 'Unfeature' : 'Feature'}
                      </Button>
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
                    <Label className="text-xs uppercase text-muted-foreground font-bold">Application Link</Label>
                    <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-1 truncate">
                      {selectedJob.applyUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Position Overview</Label>
                  <div className="prose prose-invert max-w-none bg-background/30 p-4 rounded-lg border border-white/5" dangerouslySetInnerHTML={{ __html: selectedJob.overview }} />
                </div>

                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Requirements</Label>
                  <div className="prose prose-invert max-w-none bg-background/30 p-4 rounded-lg border border-white/5" dangerouslySetInnerHTML={{ __html: selectedJob.requirements }} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg bg-card/30">
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
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function JobDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const jobId = params.id ? parseInt(params.id) : null;
  const [isApplying, setIsApplying] = useState(false);

  // Fetch the job from database
  const { data: job, isLoading, error } = trpc.jobs.getById.useQuery(
    { id: jobId || 0 },
    { enabled: !!jobId }
  );

  // Fetch the application form if it exists
  const { data: applicationForm } = trpc.applications.getForm.useQuery(
    { jobId: jobId || 0 },
    { enabled: !!jobId }
  );

  if (!jobId) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-6">This job posting does not exist.</p>
        <Button onClick={() => setLocation("/browse")}>Back to Jobs</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading Job Details</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-6">This job posting does not exist or has been removed.</p>
        <Button onClick={() => setLocation("/browse")}>Back to Jobs</Button>
      </div>
    );
  }

  const handleApply = () => {
    setIsApplying(true);
    // Always navigate to the apply page — candidates can upload resume/docs even without a PDF form
    setLocation(`/apply/${jobId}`);
    setIsApplying(false);
  };

  return (
    <div className="container py-10 min-h-screen">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
        onClick={() => setLocation("/browse")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="bg-card border-white/5 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-600/20"></div>
            <CardContent className="pt-0">
              <div className="flex gap-4 -mt-16 mb-4 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src="https://d2xsxph8kpxj0f.cloudfront.net/310519663247660894/DQCU3v7X4fheix7dHiRiz7/badge-icon_ac2dbc17.png" />
                  <AvatarFallback>{job.title?.substring(0, 2).toUpperCase() || "JB"}</AvatarFallback>
                </Avatar>
              </div>

              <div className="mb-4">
                <h1 className="text-4xl font-heading font-bold text-white mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-lg text-primary font-medium">
                  <Building2 className="w-5 h-5" />
                  Agency
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-white font-medium">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Salary</p>
                    <p className="text-white font-medium">{job.salary || "Competitive"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-white font-medium">{job.jobType || "Full-time"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="text-white font-medium">
                      {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Ongoing"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5 mb-6" />

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Open - Now Hiring
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Position Overview */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Position Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Apply Card */}
          <Card className="bg-card border-white/5 sticky top-24">
            <CardContent className="pt-6">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] h-12 text-lg font-bold mb-4"
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Now"
                )}
              </Button>

              {applicationForm && applicationForm.formUrl && (
                <p className="text-xs text-muted-foreground text-center">
                  Application form will be provided after clicking Apply
                </p>
              )}
            </CardContent>
          </Card>

          {/* Share Card */}
          <Card className="bg-card border-white/5 mt-4">
            <CardHeader>
              <CardTitle className="text-white text-sm">Share This Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

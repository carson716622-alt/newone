import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { jobService, Job } from "@/lib/jobService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ApplyJob() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const jobId = params.id ? parseInt(params.id) : null;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
        <p className="text-muted-foreground mb-6">You must be logged in to apply for jobs.</p>
        <Button onClick={() => setLocation("/candidate")}>Login / Register</Button>
      </div>
    );
  }

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

  const job = jobService.getJobById(jobId);

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-6">This job posting has been removed.</p>
        <Button onClick={() => setLocation("/browse")}>Back to Jobs</Button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        toast.error("Only PDF and Word documents are allowed");
        return;
      }
      setUploadedFile(file);
      toast.success("File selected successfully");
    }
  };

  const handleSubmitApplication = async () => {
    if (!uploadedFile) {
      toast.error("Please upload your completed application form");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Upload file to S3 and submit application via tRPC
      // For now, simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Application submitted successfully!");
      setIsSubmitted(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        setLocation("/browse");
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container py-20 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold text-white mb-2">Application Submitted!</h1>
        <p className="text-muted-foreground mb-2">Thank you for applying to</p>
        <p className="text-xl font-bold text-primary mb-6">{job.title}</p>
        <p className="text-muted-foreground mb-8">
          The {job.department} will review your application and contact you soon.
        </p>
        <Button onClick={() => setLocation("/browse")}>Browse More Jobs</Button>
      </div>
    );
  }

  return (
    <div className="container py-10 min-h-screen">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
        onClick={() => setLocation(`/job/${jobId}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job Details
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Summary */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-2xl">{job.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{job.department}</p>
                </div>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  Open
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Application Form Section */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Application Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PDF Viewer / Download Section */}
              <div className="space-y-4">
                <div className="bg-background/50 border border-white/10 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-white font-medium mb-2">Application Form</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the application form, fill it out, and upload it below
                  </p>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5">
                    <Download className="w-4 h-4 mr-2" />
                    Download Form (PDF)
                  </Button>
                </div>

                <Separator className="bg-white/5" />

                {/* File Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Upload Your Completed Application</h3>
                  
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-white font-medium mb-1">
                      {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF or Word document (max 10MB)
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {uploadedFile && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Application Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Fill out all required fields in the application form</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Make sure your contact information is correct</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Double-check spelling and grammar before submitting</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>The department will review your application and contact you</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-blue-600/10 border-primary/20 sticky top-20">
            <CardHeader>
              <CardTitle className="text-white">Ready to Submit?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {uploadedFile ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploadedFile ? "Application ready" : "Upload application form"}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                onClick={handleSubmitApplication}
                disabled={!uploadedFile || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to the terms and conditions
              </p>
            </CardContent>
          </Card>

          {/* Job Info Card */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-sm">Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Position</p>
                <p className="text-white font-medium">{job.title}</p>
              </div>
              <Separator className="bg-white/5" />
              <div>
                <p className="text-muted-foreground mb-1">Department</p>
                <p className="text-white font-medium">{job.department}</p>
              </div>
              <Separator className="bg-white/5" />
              <div>
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="text-white font-medium">{job.city}, {job.state}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

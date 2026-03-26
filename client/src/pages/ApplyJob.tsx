import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  CheckCircle2,
  Download,
  X,
  File,
  Send,
} from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function ApplyJob() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const jobId = params.id ? parseInt(params.id) : null;

  const [step, setStep] = useState<"review" | "upload" | "submitted">("review");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Uploaded files state
  const [applicationFile, setApplicationFile] = useState<{ file: File; url?: string } | null>(null);
  const [resumeFile, setResumeFile] = useState<{ file: File; url?: string } | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<{ file: File; url?: string }[]>([]);

  const applicationInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);

  // Fetch the job
  const { data: job, isLoading: jobLoading } = trpc.jobs.getById.useQuery(
    { id: jobId || 0 },
    { enabled: !!jobId }
  );

  // Fetch the application form if it exists
  const { data: applicationForm } = trpc.applications.getForm.useQuery(
    { jobId: jobId || 0 },
    { enabled: !!jobId }
  );

  // Check if already applied
  const { data: myApplications } = trpc.applications.getByCandidate.useQuery(undefined, {
    staleTime: 30000,
  });

  const alreadyApplied = myApplications?.some((app: any) => app.jobId === jobId);

  const submitMutation = trpc.applications.submit.useMutation({
    onSuccess: () => {
      setStep("submitted");
      toast.success("Application submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit application. Please try again.");
      setIsSubmitting(false);
    },
  });

  // Upload a file to the server
  const uploadFile = async (file: File, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload/${category}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "application" | "resume" | "docs"
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === "application") {
      setApplicationFile({ file: files[0] });
    } else if (type === "resume") {
      setResumeFile({ file: files[0] });
    } else {
      const newDocs = Array.from(files).map((f) => ({ file: f }));
      setSupportingDocs((prev) => [...prev, ...newDocs]);
    }
  };

  const removeSupportingDoc = (index: number) => {
    setSupportingDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitApplication = async () => {
    if (!jobId || !session) return;

    if (!applicationFile && !resumeFile) {
      toast.error("Please upload your completed application form or resume.");
      return;
    }

    setIsSubmitting(true);

    try {
      let submissionUrl = "";
      let submissionFileName = "";

      if (applicationFile) {
        submissionUrl = await uploadFile(applicationFile.file, "application-submissions");
        submissionFileName = applicationFile.file.name;
      } else if (resumeFile) {
        submissionUrl = await uploadFile(resumeFile.file, "resumes");
        submissionFileName = resumeFile.file.name;
      }

      // Upload supporting docs
      for (const doc of supportingDocs) {
        await uploadFile(doc.file, "documents");
      }

      submitMutation.mutate({
        jobId,
        submissionUrl,
        submissionFileName,
      });
    } catch (error) {
      toast.error("Failed to upload files. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!jobId) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
        <Button onClick={() => setLocation("/browse")}>Back to Jobs</Button>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
        <Button onClick={() => setLocation("/browse")}>Back to Jobs</Button>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="container py-20 max-w-2xl mx-auto text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold text-white mb-2">Already Applied</h1>
        <p className="text-muted-foreground mb-6">
          You have already submitted an application for <strong className="text-white">{job.title}</strong>.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="border-white/10" onClick={() => setLocation("/browse")}>
            Browse More Jobs
          </Button>
          <Button className="bg-primary" onClick={() => setLocation("/profile")}>
            View My Applications
          </Button>
        </div>
      </div>
    );
  }

  if (step === "submitted") {
    return (
      <div className="container py-20 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Application Submitted!</h1>
        <p className="text-muted-foreground mb-2">
          Your application for <strong className="text-white">{job.title}</strong> has been received.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          The hiring team will review your application and get back to you.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="border-white/10" onClick={() => setLocation("/browse")}>
            Browse More Jobs
          </Button>
          <Button className="bg-primary" onClick={() => setLocation("/profile")}>
            View My Applications
          </Button>
        </div>
      </div>
    );
  }

  const hasApplicationForm = applicationForm && applicationForm.formUrl;

  return (
    <div className="container py-10 min-h-screen max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-white"
        onClick={() => setLocation(`/job/${jobId}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job Details
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Apply for {job.title}</h1>
        <p className="text-muted-foreground">{job.location}</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === "review" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "review" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"}`}>
            1
          </div>
          <span className="text-sm font-medium">Review & Download</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "upload" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"}`}>
            2
          </div>
          <span className="text-sm font-medium">Upload & Submit</span>
        </div>
      </div>

      {step === "review" && (
        <div className="space-y-6">
          {hasApplicationForm ? (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Department Application Form
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This department requires you to fill out their official application form.
                  Download the PDF below, fill it out, and upload the completed version in the next step.
                </p>

                <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                  <iframe
                    src={applicationForm.formUrl}
                    className="w-full h-[500px]"
                    title="Application Form Preview"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => window.open(applicationForm.formUrl, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Application Form
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {applicationForm.formFileName}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Application Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This department does not require a specific application form.
                  You can submit your resume and any supporting documents directly.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Position Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <span className="text-white ml-2">{job.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-white ml-2">{job.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-white ml-2">{job.jobType || "Full-time"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="text-white ml-2">{job.salary || "Competitive"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8"
              onClick={() => setStep("upload")}
            >
              Continue to Upload
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          {hasApplicationForm && (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Completed Application Form *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your completed application form (PDF, DOC, or DOCX).
                </p>
                <input
                  ref={applicationInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "application")}
                />
                {applicationFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <File className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 flex-1">{applicationFile.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(applicationFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setApplicationFile(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="border-dashed border-white/20 hover:bg-white/5 w-full h-20"
                    onClick={() => applicationInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload completed application</span>
                    </div>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Resume / CV {!hasApplicationForm && "*"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume or CV (PDF, DOC, or DOCX).
              </p>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFileSelect(e, "resume")}
              />
              {resumeFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <File className="w-5 h-5 text-blue-500" />
                  <span className="text-blue-400 flex-1">{resumeFile.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(resumeFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResumeFile(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-dashed border-white/20 hover:bg-white/5 w-full h-20"
                  onClick={() => resumeInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload your resume</span>
                  </div>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <File className="w-5 h-5 text-yellow-400" />
                Supporting Documents (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload any additional documents such as certifications, transcripts, ID, or letters of recommendation.
              </p>
              <input
                ref={docsInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "docs")}
              />

              {supportingDocs.length > 0 && (
                <div className="space-y-2 mb-4">
                  {supportingDocs.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <File className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-400 flex-1 text-sm">{doc.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupportingDoc(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="border-dashed border-white/20 hover:bg-white/5"
                onClick={() => docsInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Documents
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Cover Letter (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief cover letter or message to the hiring team..."
                className="bg-background/50 border-white/10 min-h-[120px]"
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              className="border-white/10"
              onClick={() => setStep("review")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

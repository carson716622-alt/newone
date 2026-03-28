import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Pen,
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

  const [step, setStep] = useState<"form" | "documents" | "submitted">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Uploaded files state
  const [completedFormFile, setCompletedFormFile] = useState<{ file: File } | null>(null);
  const [resumeFile, setResumeFile] = useState<{ file: File } | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<{ file: File }[]>([]);

  // Required document uploads - keyed by requirement ID
  const [requiredDocFiles, setRequiredDocFiles] = useState<Record<number, { file: File }>>({});

  const completedFormRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);
  const requiredDocRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  // Fetch document requirements for this job
  const { data: docRequirements = [] } = trpc.applications.getDocumentRequirements.useQuery(
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
    onError: (err) => {
      console.error("[Submit Error]", err);
      toast.error("Failed to submit application. Please try again.");
      setIsSubmitting(false);
    },
  });

  const uploadDocMutation = trpc.applications.uploadDocument.useMutation();

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

  const handleRequiredDocSelect = (e: React.ChangeEvent<HTMLInputElement>, reqId: number) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    setRequiredDocFiles(prev => ({ ...prev, [reqId]: { file: files[0] } }));
  };

  const removeRequiredDoc = (reqId: number) => {
    setRequiredDocFiles(prev => {
      const n = { ...prev };
      delete n[reqId];
      return n;
    });
  };

  const removeSupportingDoc = (index: number) => {
    setSupportingDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitApplication = async () => {
    if (!jobId || !session) return;

    // If there's an application form, the completed form is required
    if (hasApplicationForm && !completedFormFile) {
      toast.error("Please upload your completed application form.");
      return;
    }

    // If no application form, resume is required
    if (!hasApplicationForm && !resumeFile) {
      toast.error("Please upload your resume.");
      return;
    }

    // Check required documents
    const requiredDocs = docRequirements.filter((d: any) => d.isRequired);
    const missingDocs = requiredDocs.filter((d: any) => !requiredDocFiles[d.id]);
    if (missingDocs.length > 0) {
      toast.error(`Please upload all required documents: ${missingDocs.map((d: any) => d.title).join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      let submissionUrl = "";
      let submissionFileName = "";

      // Upload the completed application form
      if (completedFormFile) {
        submissionUrl = await uploadFile(completedFormFile.file, "application-submissions");
        submissionFileName = completedFormFile.file.name;
      }

      // Upload resume
      if (resumeFile) {
        const resumeUrl = await uploadFile(resumeFile.file, "resumes");
        if (!submissionUrl) {
          submissionUrl = resumeUrl;
          submissionFileName = resumeFile.file.name;
        }
      }

      // Upload supporting docs
      for (const doc of supportingDocs) {
        await uploadFile(doc.file, "documents");
      }

      // Upload required documents and save references
      for (const [reqIdStr, docFile] of Object.entries(requiredDocFiles)) {
        const reqId = parseInt(reqIdStr);
        const url = await uploadFile(docFile.file, "documents");
        await uploadDocMutation.mutateAsync({
          jobId,
          requirementId: reqId,
          fileUrl: url,
          fileName: docFile.file.name,
        });
      }

      submitMutation.mutate({
        jobId,
        submissionUrl,
        submissionFileName,
      });
    } catch (error) {
      console.error("[Upload Error]", error);
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
  const hasDocRequirements = docRequirements.length > 0;

  return (
    <div className="container py-10 min-h-screen max-w-5xl mx-auto">
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
        <div className={`flex items-center gap-2 ${step === "form" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "form" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"}`}>
            1
          </div>
          <span className="text-sm font-medium">{hasApplicationForm ? "Fill Application" : "Review & Upload"}</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <div className={`flex items-center gap-2 ${step === "documents" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "documents" ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"}`}>
            2
          </div>
          <span className="text-sm font-medium">Documents & Submit</span>
        </div>
      </div>

      {/* ==================== STEP 1: FORM / REVIEW ==================== */}
      {step === "form" && (
        <div className="space-y-6">
          {hasApplicationForm ? (
            <>
              {/* Embedded PDF Application Form */}
              <Card className="bg-card border-white/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Pen className="w-5 h-5 text-primary" />
                      Department Application Form
                    </CardTitle>
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                      Required
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-blue-300 text-sm font-medium mb-1">How to complete this form:</p>
                        <ol className="text-blue-300/80 text-sm space-y-1 list-decimal list-inside">
                          <li>View the PDF form below — you can scroll through all pages</li>
                          <li>Click <strong>"Download Form"</strong> to save it to your computer</li>
                          <li>Open the downloaded PDF in Adobe Acrobat or your PDF reader and fill in all fields</li>
                          <li>Save the completed PDF, then upload it using the <strong>"Upload Completed Form"</strong> button below</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Embedded PDF Viewer */}
                  <div className="border border-white/10 rounded-lg overflow-hidden bg-black/30">
                    <iframe
                      src={`${applicationForm.formUrl}#toolbar=1&navpanes=0`}
                      className="w-full"
                      style={{ height: "700px" }}
                      title="Application Form"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 flex-1"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = applicationForm.formUrl;
                        link.download = applicationForm.formFileName || "application-form.pdf";
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Form ({applicationForm.formFileName})
                    </Button>
                  </div>

                  {/* Upload completed form */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-white font-medium mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      Upload Your Completed Application Form
                    </p>
                    <input
                      ref={completedFormRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setCompletedFormFile({ file: e.target.files[0] });
                      }}
                    />
                    {completedFormFile ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-green-400 flex-1 text-sm">{completedFormFile.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(completedFormFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCompletedFormFile(null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-dashed border-white/20 hover:bg-white/5 w-full h-16"
                        onClick={() => completedFormRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Click to upload your completed application form</span>
                        </div>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* No application form — just show position summary */
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Application Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This department does not require a specific application form.
                  Upload your resume and any supporting documents to apply.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Position Summary */}
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

          {/* Show required documents preview */}
          {hasDocRequirements && (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <File className="w-5 h-5 text-yellow-400" />
                  Documents You'll Need
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  In the next step, you'll be asked to upload the following documents:
                </p>
                <div className="space-y-2">
                  {docRequirements.map((req: any) => (
                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm text-white font-medium">{req.title}</span>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={req.isRequired ? "border-red-500/30 text-red-400 text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}>
                        {req.isRequired ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-8"
              onClick={() => setStep("documents")}
              disabled={hasApplicationForm && !completedFormFile}
            >
              {hasApplicationForm && !completedFormFile ? (
                "Upload completed form to continue"
              ) : (
                <>
                  Continue to Documents
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: DOCUMENTS & SUBMIT ==================== */}
      {step === "documents" && (
        <div className="space-y-6">
          {/* Completed form confirmation */}
          {hasApplicationForm && completedFormFile && (
            <Card className="bg-card border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">Application Form Uploaded</p>
                    <p className="text-xs text-muted-foreground">{completedFormFile.file.name} — {(completedFormFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 text-xs"
                    onClick={() => { setStep("form"); }}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Resume / CV {!hasApplicationForm && <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px]">Required</Badge>}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) setResumeFile({ file: e.target.files[0] });
                }}
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
                  className="border-dashed border-white/20 hover:bg-white/5 w-full h-16"
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

          {/* Required Document Uploads */}
          {hasDocRequirements && (
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <File className="w-5 h-5 text-yellow-400" />
                  Department Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload the following documents as requested by the department.
                </p>
                {docRequirements.map((req: any) => (
                  <div key={req.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{req.title}</span>
                      <Badge variant="outline" className={req.isRequired ? "border-red-500/30 text-red-400 text-[10px]" : "border-white/10 text-muted-foreground text-[10px]"}>
                        {req.isRequired ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    )}
                    <input
                      ref={(el) => { requiredDocRefs.current[req.id] = el; }}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleRequiredDocSelect(e, req.id)}
                    />
                    {requiredDocFiles[req.id] ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <File className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-400 flex-1 text-sm">{requiredDocFiles[req.id].file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(requiredDocFiles[req.id].file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequiredDoc(req.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-dashed border-white/20 hover:bg-white/5 w-full h-14"
                        onClick={() => requiredDocRefs.current[req.id]?.click()}
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload {req.title}</span>
                        </div>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Supporting Documents */}
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
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const newDocs = Array.from(files).map((f) => ({ file: f }));
                  setSupportingDocs((prev) => [...prev, ...newDocs]);
                }}
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

          {/* Cover Letter */}
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

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              className="border-white/10"
              onClick={() => setStep("form")}
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

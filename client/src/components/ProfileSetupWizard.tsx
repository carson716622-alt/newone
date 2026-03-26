import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Plus, X, CheckCircle2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProfileSetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function ProfileSetupWizard({ isOpen, onComplete }: ProfileSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [newExperience, setNewExperience] = useState({
    jobTitle: "",
    department: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [newCert, setNewCert] = useState({
    certificationName: "",
    issuingOrganization: "",
    issueDate: "",
    expirationDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const addExperienceMutation = trpc.profiles.addExperience.useMutation();
  const addCertMutation = trpc.profiles.addCertification.useMutation();
  const updateProfileMutation = trpc.profiles.updateProfile.useMutation();

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResume(file);
      toast.success("Resume uploaded successfully");
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  const addExperience = () => {
    if (!newExperience.jobTitle || !newExperience.department) {
      toast.error("Please fill in all required fields");
      return;
    }
    setExperiences([...experiences, { ...newExperience, id: Date.now() }]);
    setNewExperience({
      jobTitle: "",
      department: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    toast.success("Experience added");
  };

  const removeExperience = (id: number) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const addCertification = () => {
    if (!newCert.certificationName || !newCert.issuingOrganization) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCertifications([...certifications, { ...newCert, id: Date.now() }]);
    setNewCert({
      certificationName: "",
      issuingOrganization: "",
      issueDate: "",
      expirationDate: "",
    });
    toast.success("Certification added");
  };

  const removeCertification = (id: number) => {
    setCertifications(certifications.filter((cert) => cert.id !== id));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Update profile
      await updateProfileMutation.mutateAsync({
        bio,
        yearsOfExperience: parseInt(yearsExperience) || 0,
        skills,
      });

      // Add experiences
      for (const exp of experiences) {
        await addExperienceMutation.mutateAsync({
          jobTitle: exp.jobTitle,
          department: exp.department,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          description: exp.description,
        });
      }

      // Add certifications
      for (const cert of certifications) {
        await addCertMutation.mutateAsync({
          certificationName: cert.certificationName,
          issuingOrganization: cert.issuingOrganization,
          issueDate: cert.issueDate,
          expirationDate: cert.expirationDate || null,
        });
      }

      toast.success("Profile setup complete!");
      onComplete();
    } catch (error) {
      toast.error("Failed to complete profile setup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>

        {/* Step 1: Profile Picture & Bio */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Picture & Bio</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Profile Picture</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">About You</label>
                <textarea
                  placeholder="Tell agencies about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground mt-1"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Years of Experience</label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Skills (comma-separated)</label>
                  <Input
                    placeholder="e.g., Leadership, Investigation"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Work Experience */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Work Experience</h3>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <Card key={exp.id} className="bg-card border-border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{exp.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">{exp.department}</p>
                      </div>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="space-y-3 border border-border rounded-lg p-4">
                <Input
                  placeholder="Job Title"
                  value={newExperience.jobTitle}
                  onChange={(e) =>
                    setNewExperience({ ...newExperience, jobTitle: e.target.value })
                  }
                />
                <Input
                  placeholder="Department/Agency"
                  value={newExperience.department}
                  onChange={(e) =>
                    setNewExperience({ ...newExperience, department: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newExperience.startDate}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, startDate: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    value={newExperience.endDate}
                    onChange={(e) =>
                      setNewExperience({ ...newExperience, endDate: e.target.value })
                    }
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={newExperience.description}
                  onChange={(e) =>
                    setNewExperience({ ...newExperience, description: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  rows={3}
                />
                <Button onClick={addExperience} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Experience
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Certifications */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Certifications</h3>
            <div className="space-y-4">
              {certifications.map((cert) => (
                <Card key={cert.id} className="bg-card border-border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{cert.certificationName}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                      </div>
                      <button
                        onClick={() => removeCertification(cert.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="space-y-3 border border-border rounded-lg p-4">
                <Input
                  placeholder="Certification Name"
                  value={newCert.certificationName}
                  onChange={(e) =>
                    setNewCert({ ...newCert, certificationName: e.target.value })
                  }
                />
                <Input
                  placeholder="Issuing Organization"
                  value={newCert.issuingOrganization}
                  onChange={(e) =>
                    setNewCert({ ...newCert, issuingOrganization: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newCert.issueDate}
                    onChange={(e) =>
                      setNewCert({ ...newCert, issueDate: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    value={newCert.expirationDate}
                    onChange={(e) =>
                      setNewCert({ ...newCert, expirationDate: e.target.value })
                    }
                  />
                </div>
                <Button onClick={addCertification} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Certification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Resume */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resume (Optional)</h3>
            <div className="space-y-4">
              {resume && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">{resume.name}</p>
                  </CardContent>
                </Card>
              )}
              <div>
                <label className="text-sm font-medium">Upload PDF Resume</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${
                  s === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Completing..." : "Complete"}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

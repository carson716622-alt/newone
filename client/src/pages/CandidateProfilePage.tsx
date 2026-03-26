import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Plus, X, Upload, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState({
    bio: "",
    yearsOfExperience: "",
    skills: "",
  });
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

  // Fetch profile data
  const { data: profile, isLoading: profileLoading, refetch } = trpc.profiles.getMyProfile.useQuery();
  const { data: experiences = [] } = trpc.profiles.getExperience.useQuery();
  const { data: certifications = [] } = trpc.profiles.getCertifications.useQuery();

  // Mutations
  const updateProfileMutation = trpc.profiles.updateProfile.useMutation();
  const addExperienceMutation = trpc.profiles.addExperience.useMutation();
  const deleteExperienceMutation = trpc.profiles.deleteExperience.useMutation();
  const addCertMutation = trpc.profiles.addCertification.useMutation();
  const deleteCertMutation = trpc.profiles.deleteCertification.useMutation();

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

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        bio: editingValues.bio,
        yearsOfExperience: parseInt(editingValues.yearsOfExperience) || 0,
        skills: editingValues.skills,
      });
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExperience = async () => {
    if (!newExperience.jobTitle || !newExperience.department) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    try {
      await addExperienceMutation.mutateAsync({
        jobTitle: newExperience.jobTitle,
        department: newExperience.department,
        startDate: newExperience.startDate,
        endDate: newExperience.endDate || undefined,
        description: newExperience.description,
      });
      toast.success("Experience added successfully");
      setNewExperience({
        jobTitle: "",
        department: "",
        startDate: "",
        endDate: "",
        description: "",
      });
      setIsAddingExperience(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add experience");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExperience = async (experienceId: number) => {
    try {
      await deleteExperienceMutation.mutateAsync({ experienceId });
      toast.success("Experience deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete experience");
    }
  };

  const handleAddCertification = async () => {
    if (!newCert.certificationName || !newCert.issuingOrganization) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    try {
      await addCertMutation.mutateAsync({
        certificationName: newCert.certificationName,
        issuingOrganization: newCert.issuingOrganization,
        issueDate: newCert.issueDate,
        expirationDate: newCert.expirationDate || undefined,
      });
      toast.success("Certification added successfully");
      setNewCert({
        certificationName: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
      });
      setIsAddingCert(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add certification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCertification = async (certId: number) => {
    try {
      await deleteCertMutation.mutateAsync({ certificationId: certId });
      toast.success("Certification deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete certification");
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your professional information</p>
        </div>

        {/* Profile Overview Card */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {profile?.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl text-muted-foreground">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{user?.email}</h2>
                  <p className="text-muted-foreground">{profile?.yearsOfExperience || 0} years of experience</p>
                  <p className="text-sm text-muted-foreground mt-2">{profile?.bio || "No bio added yet"}</p>
                </div>
              </div>
              <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="experience" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Work Experience</h3>
              <Button onClick={() => setIsAddingExperience(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </Button>
            </div>

            {experiences.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No work experience added yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {experiences.map((exp: any) => (
                  <Card key={exp.id} className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{exp.jobTitle}</h4>
                          <p className="text-sm text-muted-foreground">{exp.department}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(exp.startDate).toLocaleDateString()} to{" "}
                            {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-foreground mt-2">{exp.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Certifications</h3>
              <Button onClick={() => setIsAddingCert(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Certification
              </Button>
            </div>

            {certifications.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No certifications added yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {certifications.map((cert: any) => (
                  <Card key={cert.id} className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{cert.certificationName}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            {cert.expirationDate &&
                              ` • Expires: ${new Date(cert.expirationDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCertification(cert.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Skills</h3>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(",").map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No skills added yet. Edit your profile to add skills.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">About You</label>
                <textarea
                  placeholder="Tell agencies about yourself..."
                  value={editingValues.bio}
                  onChange={(e) => setEditingValues({ ...editingValues, bio: e.target.value })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Years of Experience</label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={editingValues.yearsOfExperience}
                  onChange={(e) => setEditingValues({ ...editingValues, yearsOfExperience: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Skills (comma-separated)</label>
                <Input
                  placeholder="e.g., Community Policing, Investigation, Leadership"
                  value={editingValues.skills}
                  onChange={(e) => setEditingValues({ ...editingValues, skills: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Experience Dialog */}
        <Dialog open={isAddingExperience} onOpenChange={setIsAddingExperience}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Job Title"
                value={newExperience.jobTitle}
                onChange={(e) => setNewExperience({ ...newExperience, jobTitle: e.target.value })}
              />
              <Input
                placeholder="Department/Agency"
                value={newExperience.department}
                onChange={(e) => setNewExperience({ ...newExperience, department: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                />
              </div>
              <textarea
                placeholder="Description of your role..."
                value={newExperience.description}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                rows={3}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingExperience(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExperience} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Experience"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Certification Dialog */}
        <Dialog open={isAddingCert} onOpenChange={setIsAddingCert}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Certification Name"
                value={newCert.certificationName}
                onChange={(e) => setNewCert({ ...newCert, certificationName: e.target.value })}
              />
              <Input
                placeholder="Issuing Organization"
                value={newCert.issuingOrganization}
                onChange={(e) => setNewCert({ ...newCert, issuingOrganization: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="Issue Date"
                  value={newCert.issueDate}
                  onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Expiration Date"
                  value={newCert.expirationDate}
                  onChange={(e) => setNewCert({ ...newCert, expirationDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingCert(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCertification} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Certification"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

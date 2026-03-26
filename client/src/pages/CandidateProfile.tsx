import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Plus, Edit2, Trash2, Calendar, MapPin, Award, FileText, User, Mail, Phone } from "lucide-react";

export default function CandidateProfile() {
  const { user, loading } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    bio: "",
    phone: "",
    location: "",
    yearsOfExperience: 0,
    skills: "",
    certifications: ""
  });

  const [experienceData, setExperienceData] = useState({
    jobTitle: "",
    department: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrentPosition: false,
    description: ""
  });

  const [certData, setCertData] = useState({
    certificationName: "",
    issuingOrganization: "",
    issueDate: "",
    expirationDate: "",
    certificateUrl: ""
  });

  // Fetch profile data
  const { data: profile } = trpc.profiles.getMyProfile.useQuery();
  const { data: experience } = trpc.profiles.getExperience.useQuery();
  const { data: certifications } = trpc.profiles.getCertifications.useQuery();

  // Mutations
  const updateProfileMutation = trpc.profiles.updateProfile.useMutation();
  const updatePictureMutation = trpc.profiles.updateProfilePicture.useMutation();
  const updateResumeMutation = trpc.profiles.updateResume.useMutation();
  const addExperienceMutation = trpc.profiles.addExperience.useMutation();
  const addCertMutation = trpc.profiles.addCertification.useMutation();
  const deleteExperienceMutation = trpc.profiles.deleteExperience.useMutation();
  const deleteCertMutation = trpc.profiles.deleteCertification.useMutation();

  useEffect(() => {
    if (profile) {
      setProfileData({
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        yearsOfExperience: profile.yearsOfExperience || 0,
        skills: profile.skills || "",
        certifications: profile.certifications || ""
      });
      if (profile.profilePictureUrl) {
        setProfilePicture(profile.profilePictureUrl);
      }
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);
      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, upload to S3 first
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setProfilePicture(dataUrl);
      try {
        await updatePictureMutation.mutateAsync({ pictureUrl: dataUrl });
        toast.success("Profile picture updated!");
      } catch (error) {
        toast.error("Failed to update picture");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    // In production, upload to S3 first
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        await updateResumeMutation.mutateAsync({ resumeUrl: dataUrl });
        toast.success("Resume uploaded successfully!");
      } catch (error) {
        toast.error("Failed to upload resume");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddExperience = async () => {
    try {
      await addExperienceMutation.mutateAsync(experienceData);
      toast.success("Experience added!");
      setExperienceData({
        jobTitle: "",
        department: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrentPosition: false,
        description: ""
      });
      setIsAddingExperience(false);
    } catch (error) {
      toast.error("Failed to add experience");
    }
  };

  const handleAddCertification = async () => {
    try {
      await addCertMutation.mutateAsync(certData);
      toast.success("Certification added!");
      setCertData({
        certificationName: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
        certificateUrl: ""
      });
      setIsAddingCert(false);
    } catch (error) {
      toast.error("Failed to add certification");
    }
  };

  const handleDeleteExperience = async (id: number) => {
    try {
      await deleteExperienceMutation.mutateAsync({ experienceId: id });
      toast.success("Experience deleted!");
    } catch (error) {
      toast.error("Failed to delete experience");
    }
  };

  const handleDeleteCertification = async (id: number) => {
    try {
      await deleteCertMutation.mutateAsync({ certificationId: id });
      toast.success("Certification deleted!");
    } catch (error) {
      toast.error("Failed to delete certification");
    }
  };

  if (loading) {
    return <div className="container py-10 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-10 text-center text-muted-foreground">Please log in to view your profile</div>;
  }

  return (
    <div className="container py-10 min-h-screen">
      {/* Profile Header */}
      <Card className="mb-8 bg-card border-white/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={profilePicture || undefined} />
                <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white rounded-full p-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
              {profileData.location && (
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" /> {profileData.location}
                </p>
              )}
              {profileData.phone && (
                <p className="text-muted-foreground flex items-center gap-2 mb-4">
                  <Phone className="w-4 h-4" /> {profileData.phone}
                </p>
              )}
              {profileData.bio && (
                <p className="text-white max-w-2xl">{profileData.bio}</p>
              )}
              <Button onClick={() => setIsEditingProfile(true)} className="mt-4">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-4 bg-background border border-white/5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Years of Experience</Label>
                  <p className="text-2xl font-bold text-white">{profileData.yearsOfExperience}+ years</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Location</Label>
                  <p className="text-lg text-white">{profileData.location || "Not specified"}</p>
                </div>
              </div>

              {profileData.bio && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Bio</Label>
                  <p className="text-white">{profileData.bio}</p>
                </div>
              )}

              {profileData.skills && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.split(",").map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience">
          <div className="space-y-4">
            <Button onClick={() => setIsAddingExperience(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </Button>

            {experience && experience.length > 0 ? (
              <div className="space-y-4">
                {experience.map((exp: any) => (
                  <Card key={exp.id} className="bg-card border-white/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{exp.jobTitle}</h3>
                          <p className="text-primary font-medium">{exp.department}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExperience(exp.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                      {exp.location && (
                        <p className="text-muted-foreground flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" /> {exp.location}
                        </p>
                      )}
                      <p className="text-muted-foreground flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4" /> {exp.startDate} - {exp.endDate || "Present"}
                      </p>
                      {exp.description && (
                        <p className="text-white">{exp.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/30 border-white/5">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No experience added yet. Click "Add Experience" to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <div className="space-y-4">
            <Button onClick={() => setIsAddingCert(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Certification
            </Button>

            {certifications && certifications.length > 0 ? (
              <div className="space-y-4">
                {certifications.map((cert: any) => (
                  <Card key={cert.id} className="bg-card border-white/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" /> {cert.certificationName}
                          </h3>
                          <p className="text-muted-foreground">{cert.issuingOrganization}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCertification(cert.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Issued: {cert.issueDate}
                        {cert.expirationDate && ` • Expires: ${cert.expirationDate}`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/30 border-white/5">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No certifications added yet. Click "Add Certification" to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Resume Tab */}
        <TabsContent value="resume">
          <Card className="bg-card border-white/5">
            <CardContent className="p-8">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Upload Your Resume</h3>
                <p className="text-muted-foreground mb-6">Share your resume so departments can review your qualifications</p>
                <label className="inline-block">
                  <Button className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" /> Upload Resume (PDF)
                  </Button>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
                {resumeFile && (
                  <p className="text-sm text-primary mt-4">Selected: {resumeFile.name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="bg-card border-white/5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your professional information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bio</Label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Your phone number"
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                placeholder="City, State"
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={profileData.yearsOfExperience}
                onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: parseInt(e.target.value) })}
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Skills (comma-separated)</Label>
              <Textarea
                value={profileData.skills}
                onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                placeholder="e.g., Leadership, Investigation, Community Policing"
                className="bg-background border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog open={isAddingExperience} onOpenChange={setIsAddingExperience}>
        <DialogContent className="bg-card border-white/5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Work Experience</DialogTitle>
            <DialogDescription>Add your law enforcement work history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Title *</Label>
              <Input
                value={experienceData.jobTitle}
                onChange={(e) => setExperienceData({ ...experienceData, jobTitle: e.target.value })}
                placeholder="e.g., Police Officer"
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Department *</Label>
              <Input
                value={experienceData.department}
                onChange={(e) => setExperienceData({ ...experienceData, department: e.target.value })}
                placeholder="e.g., Chicago Police Department"
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={experienceData.location}
                onChange={(e) => setExperienceData({ ...experienceData, location: e.target.value })}
                placeholder="City, State"
                className="bg-background border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={experienceData.startDate}
                  onChange={(e) => setExperienceData({ ...experienceData, startDate: e.target.value })}
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={experienceData.endDate}
                  onChange={(e) => setExperienceData({ ...experienceData, endDate: e.target.value })}
                  disabled={experienceData.isCurrentPosition}
                  className="bg-background border-white/10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="currentPosition"
                checked={experienceData.isCurrentPosition}
                onChange={(e) => setExperienceData({ ...experienceData, isCurrentPosition: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="currentPosition" className="mb-0">This is my current position</Label>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={experienceData.description}
                onChange={(e) => setExperienceData({ ...experienceData, description: e.target.value })}
                placeholder="Describe your responsibilities and achievements..."
                className="bg-background border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingExperience(false)}>Cancel</Button>
            <Button onClick={handleAddExperience} disabled={addExperienceMutation.isPending}>
              {addExperienceMutation.isPending ? "Adding..." : "Add Experience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={isAddingCert} onOpenChange={setIsAddingCert}>
        <DialogContent className="bg-card border-white/5">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>Add your law enforcement certifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Certification Name *</Label>
              <Input
                value={certData.certificationName}
                onChange={(e) => setCertData({ ...certData, certificationName: e.target.value })}
                placeholder="e.g., Police Academy Certification"
                className="bg-background border-white/10"
              />
            </div>
            <div>
              <Label>Issuing Organization *</Label>
              <Input
                value={certData.issuingOrganization}
                onChange={(e) => setCertData({ ...certData, issuingOrganization: e.target.value })}
                placeholder="e.g., State Police Academy"
                className="bg-background border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={certData.issueDate}
                  onChange={(e) => setCertData({ ...certData, issueDate: e.target.value })}
                  className="bg-background border-white/10"
                />
              </div>
              <div>
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={certData.expirationDate}
                  onChange={(e) => setCertData({ ...certData, expirationDate: e.target.value })}
                  className="bg-background border-white/10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCert(false)}>Cancel</Button>
            <Button onClick={handleAddCertification} disabled={addCertMutation.isPending}>
              {addCertMutation.isPending ? "Adding..." : "Add Certification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

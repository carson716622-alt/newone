import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, MapPin, Calendar, Award, FileText, Download, User } from "lucide-react";

export default function CandidateProfileView() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const id = parseInt(candidateId || "0", 10);

  const { data: profile, isLoading } = trpc.profiles.getCandidateProfileById.useQuery(
    { candidateId: id },
    { enabled: !!id }
  );

  if (isLoading) {
    return <div className="container py-10 text-center">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="container py-10 text-center text-muted-foreground">Profile not found</div>;
  }

  return (
    <div className="container py-10 min-h-screen">
      {/* Profile Header */}
      <Card className="mb-8 bg-card border-white/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Profile Picture */}
            <Avatar className="h-32 w-32 border-4 border-primary/20 shrink-0">
              <AvatarImage src={profile.profilePictureUrl || undefined} />
              <AvatarFallback className="text-2xl">
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-white">Candidate Profile</h1>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  ID: {id}
                </Badge>
              </div>
              
              {profile.location && (
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </p>
              )}
              
              {profile.phone && (
                <p className="text-muted-foreground flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" /> {profile.phone}
                </p>
              )}

              {profile.yearsOfExperience && (
                <p className="text-white font-medium mb-4">
                  {profile.yearsOfExperience}+ years of law enforcement experience
                </p>
              )}

              {profile.bio && (
                <p className="text-white max-w-2xl">{profile.bio}</p>
              )}

              {profile.resumeUrl && (
                <Button className="mt-4" asChild>
                  <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Download Resume
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 bg-background border border-white/5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                  <p className="text-xs uppercase text-muted-foreground font-bold mb-2">Years of Experience</p>
                  <p className="text-2xl font-bold text-white">{profile.yearsOfExperience || 0}+ years</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                  <p className="text-xs uppercase text-muted-foreground font-bold mb-2">Location</p>
                  <p className="text-lg text-white">{profile.location || "Not specified"}</p>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Professional Bio</p>
                  <p className="text-white bg-background/30 p-4 rounded-lg">{profile.bio}</p>
                </div>
              )}

              {profile.skills && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-bold mb-3 block">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.split(",").map((skill, i) => (
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
          {profile.experience && profile.experience.length > 0 ? (
            <div className="space-y-4">
              {profile.experience.map((exp: any) => (
                <Card key={exp.id} className="bg-card border-white/5 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white">{exp.jobTitle}</h3>
                      <p className="text-primary font-medium">{exp.department}</p>
                    </div>
                    
                    {exp.location && (
                      <p className="text-muted-foreground flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" /> {exp.location}
                      </p>
                    )}
                    
                    <p className="text-muted-foreground flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" /> 
                      {exp.startDate} - {exp.isCurrentPosition ? "Present" : exp.endDate || "N/A"}
                    </p>
                    
                    {exp.isCurrentPosition && (
                      <Badge className="mb-3 bg-green-600/20 text-green-400 border-green-600/30">
                        Current Position
                      </Badge>
                    )}
                    
                    {exp.description && (
                      <p className="text-white bg-background/30 p-3 rounded">{exp.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/30 border-white/5">
              <CardContent className="p-8 text-center text-muted-foreground">
                No work experience listed
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          {profile.certifications && profile.certifications.length > 0 ? (
            <div className="space-y-4">
              {profile.certifications.map((cert: any) => (
                <Card key={cert.id} className="bg-card border-white/5 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" /> {cert.certificationName}
                        </h3>
                        <p className="text-muted-foreground">{cert.issuingOrganization}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 text-sm">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Issued: {cert.issueDate}
                      </p>
                      {cert.expirationDate && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Expires: {cert.expirationDate}
                        </p>
                      )}
                    </div>
                    
                    {cert.certificateUrl && (
                      <Button variant="outline" size="sm" className="mt-4" asChild>
                        <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" /> View Certificate
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/30 border-white/5">
              <CardContent className="p-8 text-center text-muted-foreground">
                No certifications listed
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Section */}
      <Card className="bg-card border-white/5">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.phone && (
            <div className="flex items-center gap-3 p-3 rounded bg-background/30">
              <Phone className="w-5 h-5 text-primary" />
              <a href={`tel:${profile.phone}`} className="text-white hover:text-primary transition-colors">
                {profile.phone}
              </a>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-3 p-3 rounded bg-background/30">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-white">{profile.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

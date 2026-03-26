import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Search, MapPin, Award, Briefcase, User, ExternalLink, Filter } from "lucide-react";

export default function AdminCandidateSearch() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [filterByLocation, setFilterByLocation] = useState("");
  const [filterByExperience, setFilterByExperience] = useState<number | null>(null);

  // Fetch all candidates
  const { data: candidates, isLoading } = trpc.profiles.getAllCandidates.useQuery();

  // Filter and search candidates
  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];

    return candidates.filter((candidate: any) => {
      // Search by name or location
      const matchesSearch = searchQuery === "" || 
        (candidate.location && candidate.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (candidate.bio && candidate.bio.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by location
      const matchesLocation = filterByLocation === "" || 
        (candidate.location && candidate.location.toLowerCase().includes(filterByLocation.toLowerCase()));

      // Filter by experience
      const matchesExperience = filterByExperience === null || 
        (candidate.yearsOfExperience && candidate.yearsOfExperience >= filterByExperience);

      return matchesSearch && matchesLocation && matchesExperience;
    });
  }, [candidates, searchQuery, filterByLocation, filterByExperience]);

  if (isLoading) {
    return <div className="container py-10 text-center">Loading candidates...</div>;
  }

  return (
    <div className="container py-10 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-5 duration-500">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">
              Candidate <span className="text-primary">Directory</span>
            </h1>
            <p className="text-muted-foreground">
              Browse and view candidate profiles
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-2 bg-primary/10 text-primary border-primary/20 text-sm">
          {filteredCandidates.length} Candidates
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search and Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by location or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filter by Location</label>
            <Input
              placeholder="e.g., Chicago, IL"
              value={filterByLocation}
              onChange={(e) => setFilterByLocation(e.target.value)}
              className="bg-background/50 border-white/10 focus:border-primary/50 h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Minimum Experience</label>
            <select
              value={filterByExperience === null ? "" : filterByExperience}
              onChange={(e) => setFilterByExperience(e.target.value === "" ? null : parseInt(e.target.value))}
              className="w-full bg-background/50 border border-white/10 rounded-md px-3 py-2 text-white focus:border-primary/50 focus:outline-none"
            >
              <option value="">Any</option>
              <option value="1">1+ years</option>
              <option value="3">3+ years</option>
              <option value="5">5+ years</option>
              <option value="10">10+ years</option>
            </select>
          </div>

          <Button
            variant="outline"
            className="w-full border-white/10 hover:bg-white/5"
            onClick={() => {
              setSearchQuery("");
              setFilterByLocation("");
              setFilterByExperience(null);
            }}
          >
            <Filter className="w-4 h-4 mr-2" /> Clear Filters
          </Button>

          {/* Candidate List */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Candidates</h3>
            <ScrollArea className="h-[calc(100vh-400px)] pr-4">
              <div className="space-y-2">
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                    <p>No candidates found</p>
                  </div>
                ) : (
                  filteredCandidates.map((candidate: any) => (
                    <Card
                      key={candidate.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedCandidate?.id === candidate.id
                          ? "border-primary bg-primary/5"
                          : "bg-card border-white/5"
                      }`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={candidate.profilePictureUrl || undefined} />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">Candidate #{candidate.candidateId}</p>
                            {candidate.location && (
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {candidate.location}
                              </p>
                            )}
                            {candidate.yearsOfExperience && (
                              <p className="text-xs text-primary font-medium">
                                {candidate.yearsOfExperience}+ years exp.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Column: Candidate Details */}
        <div className="lg:col-span-2">
          {selectedCandidate ? (
            <Card className="bg-card border-white/5 h-full animate-in fade-in duration-300">
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                      <AvatarImage src={selectedCandidate.profilePictureUrl || undefined} />
                      <AvatarFallback className="text-2xl">C</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-white">Candidate #{selectedCandidate.candidateId}</h2>
                      {selectedCandidate.location && (
                        <p className="text-primary font-medium flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" /> {selectedCandidate.location}
                        </p>
                      )}
                      {selectedCandidate.yearsOfExperience && (
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <Briefcase className="w-4 h-4" /> {selectedCandidate.yearsOfExperience}+ years of experience
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation(`/candidate/${selectedCandidate.candidateId}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> View Full Profile
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Bio */}
                {selectedCandidate.bio && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Professional Bio</h3>
                    <p className="text-white bg-background/30 p-3 rounded">{selectedCandidate.bio}</p>
                  </div>
                )}

                {/* Skills */}
                {selectedCandidate.skills && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.split(",").map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {selectedCandidate.experience && selectedCandidate.experience.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Work Experience
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.experience.map((exp: any) => (
                        <div key={exp.id} className="p-3 rounded bg-background/30 border border-white/5">
                          <p className="font-bold text-white">{exp.jobTitle}</p>
                          <p className="text-sm text-primary">{exp.department}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exp.startDate} - {exp.isCurrentPosition ? "Present" : exp.endDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Certifications
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.certifications.map((cert: any) => (
                        <div key={cert.id} className="p-3 rounded bg-background/30 border border-white/5">
                          <p className="font-bold text-white">{cert.certificationName}</p>
                          <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {cert.issueDate}
                            {cert.expirationDate && ` • Expires: ${cert.expirationDate}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume */}
                {selectedCandidate.resumeUrl && (
                  <div>
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10" asChild>
                      <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" /> Download Resume
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg bg-card/30">
              <User className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a candidate to view details</p>
              <p className="text-sm">Choose a candidate from the list to see their full profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

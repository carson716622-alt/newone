import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {  Search, MapPin, Briefcase, ChevronRight, Shield, Clock, Users, CheckCircle2, ArrowRight, Filter, X, ExternalLink, Loader2} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";

export default function BrowseJobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [, setLocation] = useLocation();

  // Fetch approved jobs from database
  const { data: jobs = [], isLoading } = trpc.jobs.getApproved.useQuery();

  useEffect(() => {
    // Filter jobs based on search criteria
    let result = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.location.toLowerCase().includes(query)
      );
    }

    if (locationFilter !== "all") {
      result = result.filter(job => job.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (typeFilter !== "all") {
      result = result.filter(job => job.jobType.toLowerCase() === typeFilter.toLowerCase());
    }

    setFilteredJobs(result);
  }, [searchQuery, locationFilter, typeFilter, jobs]);

  const handleJobClick = (jobId: number) => {
    setLocation(`/job/${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen pt-20 items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pt-20">
      {/* Header Section */}
      <section className="bg-card/30 border-b border-white/5 py-12">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            BROWSE <span className="text-primary">OPENINGS</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Find your next assignment. Direct connections to agencies hiring now.
          </p>
        </div>
      </section>

      <div className="container py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-white/5 sticky top-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" /> Filters
                </h3>
                {(searchQuery || locationFilter !== "all" || typeFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-muted-foreground hover:text-white"
                    onClick={() => {
                      setSearchQuery("");
                      setLocationFilter("all");
                      setTypeFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-9 bg-background/50 border-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="il">Illinois</SelectItem>
                    <SelectItem value="mi">Michigan</SelectItem>
                    <SelectItem value="fl">Florida</SelectItem>
                    <SelectItem value="wa">Washington</SelectItem>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Any Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Type</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="reserve">Reserve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job List */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing <span className="text-white font-bold">{filteredJobs.length}</span> active positions
            </p>
            <Select defaultValue="newest">
              <SelectTrigger className="w-[180px] bg-transparent border-white/10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="salary-high">Salary: High to Low</SelectItem>
                <SelectItem value="salary-low">Salary: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-lg bg-card/30">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search filters to find more results.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setLocationFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="bg-card border-white/5 hover:border-primary/50 transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <Avatar className="h-16 w-16 border-2 border-white/10 rounded-lg">
                          <AvatarImage src="https://d2xsxph8kpxj0f.cloudfront.net/310519663247660894/DQCU3v7X4fheix7dHiRiz7/badge-icon_ac2dbc17.png" />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                            {job.title?.substring(0, 2).toUpperCase() || "JB"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 text-primary font-medium text-sm">
                              <Shield className="w-3 h-3" /> Agency
                            </div>
                          </div>
                          <Badge variant="outline" className="w-fit bg-primary/5 border-primary/20 text-primary">
                            {job.jobType}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {job.salary || "Competitive"}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Clock className="w-3 h-3" /> Expires: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Ongoing"}
                          </span>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                          <div className="flex gap-2">
                            {/* Category badge can be added here if needed */}
                          </div>
                          <Button 
                            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all"
                            onClick={() => handleJobClick(job.id)}
                          >
                            View Details <ChevronRight className="ml-2 w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

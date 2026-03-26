import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Search, MapPin, Briefcase, ChevronRight, Shield, Clock, Users, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

// US States list
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [zipCode, setZipCode] = useState("");
  const [jobType, setJobType] = useState("all");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch approved jobs and featured jobs from database
  const { data: approvedJobs, isLoading: jobsLoading } = trpc.jobs.getApproved.useQuery();
  const { data: featuredJobs, isLoading: featuredLoading } = trpc.jobs.getFeatured.useQuery();

  const stats = [
    { label: "Active Agencies", value: "500+" },
    { label: "Open Positions", value: "1,200+" },
    { label: "Applications Sent", value: "50k+" },
    { label: "States Covered", value: "42" }
  ];

  // Filter jobs based on search criteria
  const handleSearch = () => {
    if (!approvedJobs || approvedJobs.length === 0) {
      toast.error("No jobs available at this time");
      return;
    }

    setIsSearching(true);

    const filtered = approvedJobs.filter((job: any) => {
      // Filter by keyword
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !job.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by state
      if (selectedState && selectedState !== "all") {
        const jobLocation = job.location.toLowerCase();
        const stateName = US_STATES.find(s => s.code === selectedState)?.name.toLowerCase();
        if (!jobLocation.includes(stateName) && !jobLocation.includes(selectedState.toLowerCase())) {
          return false;
        }
      }

      // Filter by ZIP code
      if (zipCode) {
        // Basic ZIP code matching - you may need to enhance this with a ZIP code database
        if (!job.location.includes(zipCode)) {
          return false;
        }
      }

      // Filter by job type
      if (jobType && jobType !== "all") {
        if (!job.jobType.toLowerCase().includes(jobType.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    setSearchResults(filtered);
    setIsSearching(false);

    if (filtered.length === 0) {
      toast.info("No jobs found matching your criteria");
    } else {
      toast.success(`Found ${filtered.length} job(s)`);
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Display featured jobs or search results
  // If featured jobs exist, show them; otherwise show latest approved jobs
  const displayedJobs = searchResults.length > 0 ? searchResults : (featuredJobs && featuredJobs.length > 0 ? featuredJobs : (approvedJobs || []).slice(0, 4));

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663247660894/DQCU3v7X4fheix7dHiRiz7/hero-bg_2828bde4.jpg" 
            alt="Police cruiser at night" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 animate-in slide-in-from-left-10 duration-700 fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-medium text-primary tracking-wider uppercase">The #1 Law Enforcement Hiring Hub</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[0.9] tracking-tight text-white">
              SERVE WITH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                HONOR & PRIDE
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Connect directly with police departments, sheriffs' offices, and public safety agencies. No clutter. No long contracts. Just the mission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-primary/50 rounded-sm" asChild>
                <a href="/browse">
                  BROWSE OPEN ROLES
                  <ChevronRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/5 hover:text-white rounded-sm" asChild>
                <a href="/agency-login">
                  AGENCY LOGIN
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-4 mt-8 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p>Join <span className="text-white font-bold">10,000+</span> officers hired this year</p>
            </div>
          </div>

          {/* Search Card */}
          <div className="relative animate-in slide-in-from-right-10 duration-700 fade-in delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-30"></div>
            <div className="glass-panel p-6 md:p-8 rounded-lg relative tech-border">
              <div className="scanner-line"></div>
              <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                FIND YOUR DEPLOYMENT
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keywords</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Job title, department, or keywords" 
                      className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 h-12">
                          <SelectValue placeholder="All States" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All States</SelectItem>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ZIP Code</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Enter ZIP code" 
                        className="pl-10 bg-background/50 border-white/10 focus:border-primary/50 h-12"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Type</label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="bg-background/50 border-white/10 focus:border-primary/50 h-12">
                      <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Type</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 font-bold text-lg shadow-lg shadow-primary/20"
                  onClick={handleSearch}
                  disabled={isSearching || jobsLoading}
                >
                  {isSearching ? "SEARCHING..." : "SEARCH POSITIONS"}
                </Button>
                
                <div className="flex justify-between items-center pt-2">
                  <Button variant="link" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto">
                    Advanced Search
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {approvedJobs ? `${approvedJobs.length} jobs available` : "Loading..."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-white/5 bg-card/30 backdrop-blur-sm">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center text-center">
                <span className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">{stat.value}</span>
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured/Search Results Jobs Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                {searchResults.length > 0 ? "SEARCH RESULTS" : featuredJobs && featuredJobs.length > 0 ? "FEATURED" : "LATEST"} <span className="text-primary">OPENINGS</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} position(s) matching your criteria`
                  : featuredJobs && featuredJobs.length > 0
                  ? "Top priority positions featured by agencies actively recruiting now."
                  : "Latest positions from agencies actively recruiting now."}
              </p>
            </div>
            {searchResults.length > 0 && (
              <Button 
                variant="outline" 
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/60"
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery("");
                  setSelectedState("");
                  setZipCode("");
                  setJobType("");
                }}
              >
                Clear Search
              </Button>
            )}
          </div>

          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedJobs.map((job: any) => (
                <Card key={job.id} className="bg-card border-white/5 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 flex-1">
                        <div className="w-12 h-12 rounded bg-white/5 p-2 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors shrink-0">
                          <Shield className="w-full h-full text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{job.title}</h3>
                          <p className="text-muted-foreground font-medium truncate">{job.location}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0 ml-2">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-2 gap-y-2 text-sm mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-4 h-4 text-primary/70" />
                        {job.jobType}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary/70" />
                        {job.salary || "Competitive"}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-3 line-clamp-2">{job.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full bg-white/5 hover:bg-primary hover:text-white text-white border border-white/10 hover:border-primary/50 transition-all duration-300"
                      onClick={() => setLocation(`/job/${job.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No jobs available at this time</p>
              <p className="text-muted-foreground text-sm mt-2">Check back soon for new opportunities</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
        
        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
            READY TO <span className="text-primary">SERVE?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of officers who found their calling through ApplytoBlue. Your next deployment is waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-primary/50" asChild>
              <a href="/candidate-auth">START YOUR SEARCH</a>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold border-white/20 hover:bg-white/5 hover:text-white" asChild>
              <a href="/candidate-auth">CREATE PROFILE</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

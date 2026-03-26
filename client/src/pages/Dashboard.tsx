import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  FileText, 
  Settings, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  ExternalLink,
  Eye,
  MousePointerClick,
  Shield,
  Search,
  Edit
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jobService, Job } from "@/lib/jobService";
import { authService } from "@/lib/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { session } = useAuth();
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [agencyJobs, setAgencyJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    jobTitle: "",
    city: "",
    state: "",
    zip: "",
    employmentType: "Full-time",
    roleCategory: "Police",
    overview: "",
    requirements: "",
    deadline: "",
    salary: "",
    applyLink: "",
    website: "",
    applicationFormFile: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    // Load jobs from service for this agency
    if (session?.agencyId) {
      const agencyProfile = authService.getAgencyProfile(session.agencyId);
      if (agencyProfile) {
        const allJobs = jobService.getAllJobs();
        const filtered = allJobs.filter(job => job.department === agencyProfile.departmentName);
        setAgencyJobs(filtered);
      }
    }
  }, [session?.agencyId]);

  const agencyProfile = session?.agencyId ? authService.getAgencyProfile(session.agencyId) : null;

  // Check for duplicates whenever title or location changes
  const checkDuplicate = (title: string, city: string) => {
    if (!title || !city) {
      setDuplicateWarning(null);
      return;
    }

    const isDuplicate = agencyJobs.some(job => 
      job.title.toLowerCase() === title.toLowerCase() && 
      job.city.toLowerCase() === city.toLowerCase() &&
      job.status !== "expired"
    );

    if (isDuplicate) {
      setDuplicateWarning("Warning: You already have an active listing with this title in this location.");
    } else {
      setDuplicateWarning(null);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.deadline.trim()) newErrors.deadline = "Application deadline is required";
    
    if (!formData.applyLink.trim()) {
      newErrors.applyLink = "Application URL is required";
    } else {
      try {
        new URL(formData.applyLink);
      } catch (e) {
        newErrors.applyLink = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      setIsPostJobOpen(false);
      toast.success("Job posted successfully! Pending review.");
      
      // Reset form
      setFormData({
        jobTitle: "",
        city: "",
        state: "",
        zip: "",
        employmentType: "Full-time",
        roleCategory: "Police",
        overview: "",
        requirements: "",
        deadline: "",
        salary: "",
        applyLink: "",
        website: ""
      });
      setErrors({});
      setDuplicateWarning(null);
    },
    onError: () => {
      toast.error("Failed to post job. Please try again.");
    }
  });

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    if (!session?.agencyId) {
      toast.error("Agency ID not found. Please log in again.");
      return;
    }

    const location = `${formData.city}, ${formData.state}${formData.zip ? ` ${formData.zip}` : ''}`;
    const deadline = formData.deadline ? new Date(formData.deadline) : undefined;

    createJobMutation.mutate({
      agencyId: session.agencyId,
      title: formData.jobTitle,
      description: formData.overview,
      location: location,
      salary: formData.salary,
      jobType: formData.employmentType,
      requirements: formData.requirements,
      deadline: deadline
    });
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {agencyProfile?.logo ? (
                  <AvatarImage src={agencyProfile.logo} />
                ) : (
                  <AvatarImage src="https://d2xsxph8kpxj0f.cloudfront.net/310519663247660894/DQCU3v7X4fheix7dHiRiz7/badge-icon_ac2dbc17.png" />
                )}
                <AvatarFallback>{agencyProfile?.departmentName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold font-display text-white">{agencyProfile?.departmentName}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-3 w-3 text-primary" />
                  <span>Agency Portal • {agencyProfile?.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Opening
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 bg-[#0f172a] border-white/10">
                <DialogHeader className="p-6 border-b border-white/10">
                  <DialogTitle className="text-2xl font-display text-white">Post a new opening</DialogTitle>
                  <DialogDescription>
                    Share a role for your agency. You can monitor views and apply clicks.
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="h-full max-h-[calc(90vh-140px)]">
                  <div className="p-6 space-y-6">
                    {duplicateWarning && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Duplicate Listing Detected</AlertTitle>
                        <AlertDescription>{duplicateWarning}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="text-white">Job title *</Label>
                      <Input 
                        id="jobTitle" 
                        value={formData.jobTitle}
                        onChange={(e) => {
                          setFormData({...formData, jobTitle: e.target.value});
                          checkDuplicate(e.target.value, formData.city);
                        }}
                        placeholder="e.g. Police Officer (Entry-Level)" 
                        className={`bg-background/50 border-white/10 ${errors.jobTitle ? "border-red-500" : ""}`}
                      />
                      {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-white">City *</Label>
                        <LocationAutocomplete
                          value={formData.city}
                          onChange={(val) => {
                            setFormData({...formData, city: val});
                            checkDuplicate(formData.jobTitle, val);
                          }}
                          onSelect={(city, state, zip) => {
                            setFormData(prev => {
                              const newData = {...prev, city, state, zip};
                              checkDuplicate(prev.jobTitle, city);
                              return newData;
                            });
                          }}
                          className={`bg-background/50 border-white/10 ${errors.city ? "border-red-500" : ""}`}
                          error={!!errors.city}
                        />
                        {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-white">State *</Label>
                        <Select 
                          value={formData.state} 
                          onValueChange={(val) => setFormData({...formData, state: val})}
                        >
                          <SelectTrigger className={`bg-background/50 border-white/10 ${errors.state ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem value="AK">Alaska</SelectItem>
                            <SelectItem value="AZ">Arizona</SelectItem>
                            <SelectItem value="AR">Arkansas</SelectItem>
                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem value="CO">Colorado</SelectItem>
                            <SelectItem value="CT">Connecticut</SelectItem>
                            <SelectItem value="DE">Delaware</SelectItem>
                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem value="GA">Georgia</SelectItem>
                            <SelectItem value="HI">Hawaii</SelectItem>
                            <SelectItem value="ID">Idaho</SelectItem>
                            <SelectItem value="IL">Illinois</SelectItem>
                            <SelectItem value="IN">Indiana</SelectItem>
                            <SelectItem value="IA">Iowa</SelectItem>
                            <SelectItem value="KS">Kansas</SelectItem>
                            <SelectItem value="KY">Kentucky</SelectItem>
                            <SelectItem value="LA">Louisiana</SelectItem>
                            <SelectItem value="ME">Maine</SelectItem>
                            <SelectItem value="MD">Maryland</SelectItem>
                            <SelectItem value="MA">Massachusetts</SelectItem>
                            <SelectItem value="MI">Michigan</SelectItem>
                            <SelectItem value="MN">Minnesota</SelectItem>
                            <SelectItem value="MS">Mississippi</SelectItem>
                            <SelectItem value="MO">Missouri</SelectItem>
                            <SelectItem value="MT">Montana</SelectItem>
                            <SelectItem value="NE">Nebraska</SelectItem>
                            <SelectItem value="NV">Nevada</SelectItem>
                            <SelectItem value="NH">New Hampshire</SelectItem>
                            <SelectItem value="NJ">New Jersey</SelectItem>
                            <SelectItem value="NM">New Mexico</SelectItem>
                            <SelectItem value="NY">New York</SelectItem>
                            <SelectItem value="NC">North Carolina</SelectItem>
                            <SelectItem value="ND">North Dakota</SelectItem>
                            <SelectItem value="OH">Ohio</SelectItem>
                            <SelectItem value="OK">Oklahoma</SelectItem>
                            <SelectItem value="OR">Oregon</SelectItem>
                            <SelectItem value="PA">Pennsylvania</SelectItem>
                            <SelectItem value="RI">Rhode Island</SelectItem>
                            <SelectItem value="SC">South Carolina</SelectItem>
                            <SelectItem value="SD">South Dakota</SelectItem>
                            <SelectItem value="TN">Tennessee</SelectItem>
                            <SelectItem value="TX">Texas</SelectItem>
                            <SelectItem value="UT">Utah</SelectItem>
                            <SelectItem value="VT">Vermont</SelectItem>
                            <SelectItem value="VA">Virginia</SelectItem>
                            <SelectItem value="WA">Washington</SelectItem>
                            <SelectItem value="WV">West Virginia</SelectItem>
                            <SelectItem value="WI">Wisconsin</SelectItem>
                            <SelectItem value="WY">Wyoming</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="text-white">ZIP code</Label>
                        <Input 
                          id="zip" 
                          value={formData.zip}
                          onChange={(e) => setFormData({...formData, zip: e.target.value})}
                          placeholder="ZIP code" 
                          className="bg-background/50 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-white">Employment type</Label>
                        <Select 
                          value={formData.employmentType}
                          onValueChange={(val) => setFormData({...formData, employmentType: val})}
                        >
                          <SelectTrigger className="bg-background/50 border-white/10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Reserve">Reserve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">Role category</Label>
                      <Select 
                        value={formData.roleCategory}
                        onValueChange={(val) => setFormData({...formData, roleCategory: val})}
                      >
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Police">Police</SelectItem>
                          <SelectItem value="Sheriff">Sheriff</SelectItem>
                          <SelectItem value="Dispatch">Dispatch</SelectItem>
                          <SelectItem value="Corrections">Corrections</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overview" className="text-white">Position overview / description</Label>
                      <RichTextEditor 
                        value={formData.overview} 
                        onChange={(val) => setFormData({...formData, overview: val})} 
                        placeholder="Summarize the role, schedule, and what makes this department unique."
                        minHeight="150px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requirements" className="text-white">Requirements (experience, certifications, etc.)</Label>
                      <RichTextEditor 
                        value={formData.requirements} 
                        onChange={(val) => setFormData({...formData, requirements: val})} 
                        placeholder="Minimum age, education, POST certification, lateral criteria, etc."
                        minHeight="150px"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Minimum education / eligibility</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="hs" className="border-white/20" />
                          <label htmlFor="hs" className="text-sm text-muted-foreground">High school diploma / GED</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="credits" className="border-white/20" />
                          <label htmlFor="credits" className="text-sm text-muted-foreground">60+ credit hours</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="associate" className="border-white/20" />
                          <label htmlFor="associate" className="text-sm text-muted-foreground">Associate's degree</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="bachelor" className="border-white/20" />
                          <label htmlFor="bachelor" className="text-sm text-muted-foreground">Bachelor's degree</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="power" className="border-white/20" />
                          <label htmlFor="power" className="text-sm text-muted-foreground">Valid POWER card</label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred" className="text-white">Preferred qualifications (nice-to-haves)</Label>
                      <Textarea 
                        id="preferred" 
                        placeholder="Language skills, specialty units, bachelor's degree preferred, etc." 
                        className="bg-background/50 border-white/10 min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-white">Applications due by *</Label>
                        <Input 
                          id="deadline" 
                          type="date" 
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                          className={`bg-background/50 border-white/10 ${errors.deadline ? "border-red-500" : ""}`}
                        />
                        {errors.deadline && <p className="text-xs text-red-500">{errors.deadline}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary" className="text-white">Compensation (optional)</Label>
                        <Input 
                          id="salary" 
                          value={formData.salary}
                          onChange={(e) => setFormData({...formData, salary: e.target.value})}
                          placeholder="$62,000 starting, lateral DOE" 
                          className="bg-background/50 border-white/10" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applyLink" className="text-white">Apply link (URL) *</Label>
                      <Input 
                        id="applyLink" 
                        value={formData.applyLink}
                        onChange={(e) => setFormData({...formData, applyLink: e.target.value})}
                        placeholder="https://your-agency.gov/jobs/apply" 
                        className={`bg-background/50 border-white/10 ${errors.applyLink ? "border-red-500" : ""}`}
                      />
                      {errors.applyLink && <p className="text-xs text-red-500">{errors.applyLink}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-white">Department website (optional)</Label>
                      <Input 
                        id="website" 
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        placeholder="https://your-agency.gov" 
                        className="bg-background/50 border-white/10" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicationForm" className="text-white">Application Form (PDF) *</Label>
                      <p className="text-xs text-muted-foreground">Upload the application form candidates will download and submit</p>
                      <Input 
                        id="applicationForm" 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({...formData, applicationFormFile: file});
                          }
                        }}
                        className="bg-background/50 border-white/10"
                      />
                      {formData.applicationFormFile && (
                        <p className="text-xs text-green-400">✓ {formData.applicationFormFile.name}</p>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t border-white/10 bg-[#0f172a]">
                  <Button variant="ghost" onClick={() => setIsPostJobOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">Post job</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">ACTIVE LISTINGS</p>
                  <h3 className="text-3xl font-bold text-white">{agencyJobs.filter(j => j.status === 'active').length}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">TOTAL VIEWS</p>
                  <h3 className="text-3xl font-bold text-white">
                    {(agencyJobs.reduce((acc, job) => acc + job.views, 0) / 1000).toFixed(1)}k
                  </h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">PENDING REVIEW</p>
                  <h3 className="text-3xl font-bold text-white">{agencyJobs.filter(j => j.status === 'pending').length}</h3>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-xl font-display text-white">Job Listings</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search listings..." 
                  className="pl-9 bg-background/50 border-white/10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-background/50 border border-white/10 mb-6">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>

              {["active", "pending", "expired"].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {agencyJobs.filter(job => job.status === status).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No {status} listings found.
                    </div>
                  ) : (
                    agencyJobs.filter(job => job.status === status).map((job) => (
                      <div key={job.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border border-white/5 bg-background/30 hover:bg-background/50 transition-colors gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                            <Badge variant={
                              status === "active" ? "default" : 
                              status === "pending" ? "secondary" : "destructive"
                            } className={
                              status === "active" ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" :
                              status === "pending" ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" :
                              "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            }>
                              {status === "active" ? "Active" : status === "pending" ? "Pending Review" : "Expired"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.city}, {job.state}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Posted: {job.postedDate}
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <AlertCircle className="h-3 w-3" />
                              Expires: {job.expiresDate}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="flex gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-white text-lg">{job.views}</p>
                              <p className="text-muted-foreground text-xs">VIEWS</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-blue-400 text-lg">{job.clicks}</p>
                              <p className="text-muted-foreground text-xs">CLICKS</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5" asChild>
                              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

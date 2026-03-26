import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, Users, Briefcase, FileText, CheckCircle2, 
  XCircle, Clock, Eye, MousePointerClick, Download, Filter
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("all");

  // Fetch data from database
  const { data: approvedJobs } = trpc.jobs.getApproved.useQuery();
  const { data: pendingJobs } = trpc.jobs.getPending.useQuery();

  // Mock data for analytics (in production, these would come from database queries)
  const analyticsData = {
    totalAgencies: 127,
    activeAgencies: 98,
    totalJobs: approvedJobs?.length || 0,
    pendingApprovals: pendingJobs?.length || 0,
    totalApplications: 3421,
    totalCandidates: 5234,
    conversionRate: 12.5,
    avgApplicationsPerJob: 8.2,
  };

  // Job postings trend data
  const jobTrendData = [
    { month: "Jan", posted: 45, approved: 38, rejected: 7 },
    { month: "Feb", posted: 52, approved: 44, rejected: 8 },
    { month: "Mar", posted: 48, approved: 41, rejected: 7 },
    { month: "Apr", posted: 61, approved: 52, rejected: 9 },
    { month: "May", posted: 55, approved: 47, rejected: 8 },
    { month: "Jun", posted: 67, approved: 58, rejected: 9 },
  ];

  // Job type distribution
  const jobTypeData = [
    { name: "Police Officer", value: 145, color: "#3b82f6" },
    { name: "Detective", value: 87, color: "#06b6d4" },
    { name: "Sheriff Deputy", value: 92, color: "#8b5cf6" },
    { name: "Dispatcher", value: 56, color: "#ec4899" },
    { name: "Other", value: 34, color: "#f59e0b" },
  ];

  // Application status distribution
  const applicationStatusData = [
    { name: "Applied", value: 1204, color: "#3b82f6" },
    { name: "Reviewing", value: 456, color: "#f59e0b" },
    { name: "Shortlisted", value: 234, color: "#06b6d4" },
    { name: "Rejected", value: 892, color: "#ef4444" },
    { name: "Accepted", value: 635, color: "#10b981" },
  ];

  // Top agencies
  const topAgencies = [
    { name: "Chicago Police Department", jobs: 12, applications: 324, conversionRate: 15.2 },
    { name: "NYPD", jobs: 8, applications: 287, conversionRate: 18.5 },
    { name: "Los Angeles Police Department", jobs: 10, applications: 256, conversionRate: 14.8 },
    { name: "Houston Police Department", jobs: 7, applications: 198, conversionRate: 16.2 },
    { name: "Miami Police Department", jobs: 6, applications: 145, conversionRate: 12.4 },
  ];

  // Recent activity
  const recentActivity = [
    { type: "job_posted", agency: "Chicago PD", title: "Police Officer", time: "2 hours ago" },
    { type: "job_approved", agency: "NYPD", title: "Detective", time: "4 hours ago" },
    { type: "application", agency: "LAPD", title: "Sheriff Deputy", count: 5, time: "6 hours ago" },
    { type: "job_rejected", agency: "Houston PD", title: "Dispatcher", reason: "Incomplete info", time: "1 day ago" },
    { type: "candidate_registered", name: "John Smith", time: "1 day ago" },
  ];

  const handleExportData = () => {
    toast.success("Analytics data exported as CSV");
  };

  const handleGenerateReport = () => {
    toast.success("Monthly report generated and sent to your email");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Analytics</h1>
            <p className="text-muted-foreground">Track platform performance and user engagement</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportData} className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
            <Button onClick={handleGenerateReport} className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Total Jobs Posted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analyticsData.totalJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.pendingApprovals} pending approval
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analyticsData.totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-primary" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analyticsData.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {analyticsData.avgApplicationsPerJob} per job
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analyticsData.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Applications to hires
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-white/5">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle>Job Postings Trend</CardTitle>
                <CardDescription>Posted, approved, and rejected jobs over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={jobTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="posted" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle>Monthly Approvals</CardTitle>
                <CardDescription>Job posting approvals by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jobTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="approved" fill="#3b82f6" />
                    <Bar dataKey="rejected" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-white/5">
                <CardHeader>
                  <CardTitle>Job Types Distribution</CardTitle>
                  <CardDescription>Breakdown by position type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={jobTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {jobTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                        labelStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Current status of all applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                        labelStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle>Top Agencies</CardTitle>
                <CardDescription>Agencies with most job postings and applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAgencies.map((agency, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 hover:border-primary/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{agency.name}</h4>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {agency.jobs} jobs
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" />
                            {agency.applications} apps
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{agency.conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">conversion</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                      <div className="mt-1">
                        {activity.type === "job_posted" && <Briefcase className="w-4 h-4 text-blue-500" />}
                        {activity.type === "job_approved" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {activity.type === "job_rejected" && <XCircle className="w-4 h-4 text-red-500" />}
                        {activity.type === "application" && <MousePointerClick className="w-4 h-4 text-yellow-500" />}
                        {activity.type === "candidate_registered" && <Users className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {activity.type === "job_posted" && (
                          <p className="text-sm text-white">
                            <span className="font-semibold">{activity.agency}</span> posted <span className="text-primary">{activity.title}</span>
                          </p>
                        )}
                        {activity.type === "job_approved" && (
                          <p className="text-sm text-white">
                            <span className="text-primary">{activity.title}</span> from <span className="font-semibold">{activity.agency}</span> approved
                          </p>
                        )}
                        {activity.type === "job_rejected" && (
                          <p className="text-sm text-white">
                            <span className="text-primary">{activity.title}</span> rejected - {activity.reason}
                          </p>
                        )}
                        {activity.type === "application" && (
                          <p className="text-sm text-white">
                            <span className="font-semibold">{activity.count} applications</span> for <span className="text-primary">{activity.title}</span>
                          </p>
                        )}
                        {activity.type === "candidate_registered" && (
                          <p className="text-sm text-white">
                            New candidate <span className="font-semibold">{activity.name}</span> registered
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Target, Users, Heart, ChevronRight, CheckCircle2,
  Zap, Eye, Lock, ArrowRight, Star, Globe, Award, Handshake,
  Building2, UserCheck, FileSearch, Send, Briefcase, Clock,
} from "lucide-react";
import { useLocation } from "wouter";

/* ── Core Values ─────────────────────────────────────────── */
const VALUES = [
  {
    icon: Shield,
    title: "Integrity First",
    description:
      "We uphold the same ethical standards we expect from the officers and agencies we serve. Transparency and honesty guide every decision.",
  },
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "Every feature we build is designed with one goal: connecting the right candidates with the right departments to strengthen public safety.",
  },
  {
    icon: Users,
    title: "Community Focused",
    description:
      "We believe great policing starts with great hiring. By improving recruitment, we help build safer, more connected communities.",
  },
  {
    icon: Heart,
    title: "Service Above Self",
    description:
      "Inspired by the men and women who wear the badge, we are committed to serving those who serve. Their mission is our mission.",
  },
  {
    icon: Lock,
    title: "Trust & Security",
    description:
      "Candidate data, agency communications, and application materials are protected with enterprise-grade security at every step.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "We continuously modernize the law enforcement hiring process, replacing outdated paperwork with streamlined digital workflows.",
  },
];

/* ── How It Works Steps ──────────────────────────────────── */
const STEPS_AGENCY = [
  {
    icon: Building2,
    step: "01",
    title: "Register Your Agency",
    description: "Create your department profile and get verified by our admin team within 24 hours.",
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Post Open Positions",
    description: "List roles with custom requirements, document uploads, salary ranges, and deadlines.",
  },
  {
    icon: UserCheck,
    step: "03",
    title: "Review & Hire",
    description: "Screen applications, message candidates directly, and manage your entire pipeline in one place.",
  },
];

const STEPS_CANDIDATE = [
  {
    icon: Users,
    step: "01",
    title: "Create Your Profile",
    description: "Build a comprehensive candidate profile with your experience, certifications, and documents.",
  },
  {
    icon: Briefcase,
    step: "02",
    title: "Browse & Apply",
    description: "Search openings by location, role type, and department. Apply with a single click.",
  },
  {
    icon: Send,
    step: "03",
    title: "Connect & Get Hired",
    description: "Message departments directly, track your applications, and land your next assignment.",
  },
];

/* ── Stats ────────────────────────────────────────────────── */
const STATS = [
  { value: "500+", label: "Agencies Nationwide", icon: Building2 },
  { value: "1,200+", label: "Active Openings", icon: Briefcase },
  { value: "50,000+", label: "Applications Processed", icon: FileSearch },
  { value: "42", label: "States Covered", icon: Globe },
];

export default function AboutUs() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col w-full">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-28 pb-20">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary tracking-widest uppercase">About ApplytoBlue</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[0.95] tracking-tight text-white mb-6">
            MODERNIZING{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              LAW ENFORCEMENT
            </span>
            <br />
            RECRUITMENT
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
            ApplytoBlue is the dedicated hiring platform built exclusively for law enforcement agencies and the
            candidates who want to serve. We bridge the gap between departments seeking qualified officers and
            professionals ready to answer the call.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-primary/50 rounded-sm"
              onClick={() => setLocation("/browse")}
            >
              BROWSE OPENINGS
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/5 hover:text-white rounded-sm"
              onClick={() => setLocation("/candidate")}
            >
              JOIN AS CANDIDATE
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/5 bg-card/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          OUR STORY / MISSION
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-6 text-xs font-bold tracking-widest uppercase px-4 py-1.5">
                Our Mission
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
                Built for Those Who{" "}
                <span className="text-primary">Protect & Serve</span>
              </h2>
              <div className="space-y-5 text-muted-foreground text-lg leading-relaxed">
                <p>
                  Law enforcement hiring has long been burdened by fragmented job boards, paper-heavy
                  applications, and disconnected communication channels. Agencies struggle to reach qualified
                  candidates, and aspiring officers face a maze of outdated processes.
                </p>
                <p>
                  <strong className="text-white">ApplytoBlue was created to change that.</strong> We provide a
                  single, purpose-built platform where agencies post openings with custom requirements, and
                  candidates apply, upload documents, and communicate directly with hiring managers — all in
                  one secure environment.
                </p>
                <p>
                  Whether you are a small-town sheriff's office or a major metropolitan department, ApplytoBlue
                  gives you the tools to find, evaluate, and hire the best talent faster than ever before.
                </p>
              </div>
            </div>

            {/* Right — Feature highlights */}
            <div className="space-y-5">
              {[
                {
                  icon: Award,
                  title: "Purpose-Built for Law Enforcement",
                  desc: "Not a generic job board. Every feature is tailored to the unique needs of police, sheriff, and public safety hiring.",
                },
                {
                  icon: Handshake,
                  title: "Direct Agency-Candidate Connection",
                  desc: "Built-in secure messaging lets candidates and departments communicate without leaving the platform.",
                },
                {
                  icon: Eye,
                  title: "Full Pipeline Visibility",
                  desc: "Agencies track every application from submission to offer. Candidates see real-time status updates on every role.",
                },
                {
                  icon: Lock,
                  title: "Secure Document Handling",
                  desc: "Background checks, POST certificates, transcripts — all uploaded, stored, and shared through encrypted channels.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-5 p-5 rounded-xl bg-card border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CORE VALUES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        <div className="container relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-6 text-xs font-bold tracking-widest uppercase px-4 py-1.5">
              What We Stand For
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Our Core <span className="text-primary">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build, every partnership we form, and every candidate we help place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((value) => (
              <Card
                key={value.title}
                className="bg-card/60 border-white/5 hover:border-primary/30 transition-all duration-300 group backdrop-blur-sm"
              >
                <CardContent className="p-7">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <value.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-6 text-xs font-bold tracking-widest uppercase px-4 py-1.5">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you are an agency looking to hire or a candidate ready to serve, getting started takes just minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Agencies */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white">For Agencies</h3>
              </div>
              <div className="space-y-6">
                {STEPS_AGENCY.map((step, i) => (
                  <div key={step.step} className="flex gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-heading font-bold text-primary text-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {step.step}
                      </div>
                      {i < STEPS_AGENCY.length - 1 && (
                        <div className="w-px h-full bg-gradient-to-b from-primary/30 to-transparent mt-2" />
                      )}
                    </div>
                    <div className="pb-8">
                      <h4 className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Candidates */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white">For Candidates</h3>
              </div>
              <div className="space-y-6">
                {STEPS_CANDIDATE.map((step, i) => (
                  <div key={step.step} className="flex gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-heading font-bold text-primary text-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {step.step}
                      </div>
                      {i < STEPS_CANDIDATE.length - 1 && (
                        <div className="w-px h-full bg-gradient-to-b from-primary/30 to-transparent mt-2" />
                      )}
                    </div>
                    <div className="pb-8">
                      <h4 className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WHY CHOOSE US
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        <div className="container relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-6 text-xs font-bold tracking-widest uppercase px-4 py-1.5">
              The ApplytoBlue Advantage
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Why Agencies & Candidates{" "}
              <span className="text-primary">Choose Us</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "No Generic Job Boards",
                desc: "ApplytoBlue is built exclusively for law enforcement. Every feature, every workflow, every detail is designed for the way agencies actually hire.",
                icon: Target,
              },
              {
                title: "Custom Document Requirements",
                desc: "Agencies define exactly what documents candidates must upload — POST certificates, background authorizations, fitness test results, and more.",
                icon: FileSearch,
              },
              {
                title: "Real-Time Messaging",
                desc: "Candidates and agencies communicate directly through our secure, built-in messenger with read receipts and notification badges.",
                icon: Send,
              },
              {
                title: "Application Pipeline Management",
                desc: "Track every candidate from Applied to Offered with a clear, visual pipeline. Never lose track of a promising applicant again.",
                icon: Clock,
              },
              {
                title: "Admin-Verified Agencies",
                desc: "Every agency on ApplytoBlue is reviewed and approved by our admin team, so candidates know they are applying to legitimate departments.",
                icon: CheckCircle2,
              },
              {
                title: "Completely Free for Candidates",
                desc: "Creating a profile, browsing jobs, applying, and messaging agencies — it is all free for candidates, always.",
                icon: Star,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-5 p-6 rounded-xl bg-card border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:2rem_2rem]" />

        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-8">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
            READY TO GET{" "}
            <span className="text-primary">STARTED?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Join the platform trusted by hundreds of agencies and thousands of law enforcement professionals
            across the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-primary/50 rounded-sm"
              onClick={() => setLocation("/browse")}
            >
              BROWSE OPEN ROLES
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/5 hover:text-white rounded-sm"
              onClick={() => setLocation("/agency-login")}
            >
              AGENCY LOGIN
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

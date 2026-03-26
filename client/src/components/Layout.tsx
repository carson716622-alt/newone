import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Menu, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWidget } from "./ChatWidget";

function AuthNavButtons() {
  const { session, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{session.name}</span>
        {session.type === 'admin' && (
          <Link href="/admin">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 h-9 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
              ADMIN PANEL
            </Button>
          </Link>
        )}
        {session.type === 'agency' && (
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-3 h-9">
              DASHBOARD
            </Button>
          </Link>
        )}
        {session.type === 'candidate' && (
          <Link href="/profile">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 text-xs px-3 h-9">
              <User className="w-4 h-4 mr-1" />
              MY PROFILE
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            setLocation('/');
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <>
      <Link href="/agency-login">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium">
          Agency Login
        </Button>
      </Link>
      <Link href="/candidate">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium">
          Candidate
        </Button>
      </Link>
      <Link href="/agency-register">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-primary/50">
          POST A JOB
        </Button>
      </Link>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse Jobs" },
    { href: "/agencies", label: "For Agencies" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* Tactical Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? "bg-background/90 backdrop-blur-md border-white/10 py-3" 
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="container flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary fill-primary/20 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-50 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xl tracking-wider leading-none">
                  APPLYTO<span className="text-primary">BLUE</span>
                </span>
                <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase leading-none">
                  Hiring Hub
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span 
                  className={`text-sm font-medium tracking-wide transition-colors hover:text-primary cursor-pointer uppercase ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <AuthNavButtons />
          </div>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-l border-white/10 w-[300px] p-0">
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <span className="font-heading font-bold text-lg">APPLYTOBLUE</span>
                  </div>
                </div>
                
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span 
                        className={`text-lg font-medium transition-colors hover:text-primary cursor-pointer ${
                          location === link.href ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex flex-col gap-4">
                  {session ? (
                    <>
                      <div className="text-sm text-muted-foreground mb-2">Logged in as: {session.name}</div>
                      {session.type === 'admin' && (
                        <Link href="/admin">
                          <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                            ADMIN PANEL
                          </Button>
                        </Link>
                      )}
                      {session.type === 'agency' && (
                        <Link href="/dashboard">
                          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                            DASHBOARD
                          </Button>
                        </Link>
                      )}
                      {session.type === 'candidate' && (
                        <Link href="/profile">
                          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                            <User className="w-4 h-4 mr-2" />
                            MY PROFILE
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full border-white/10 hover:bg-white/5"
                        onClick={() => {
                          window.location.href = '/';
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/agency-login">
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                          Agency Login
                        </Button>
                      </Link>
                      <Link href="/candidate">
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                          Candidate Portal
                        </Button>
                      </Link>
                      <Link href="/agency-register">
                        <Button className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                          POST A JOB
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {children}
      </main>
      <ChatWidget />

      <footer className="bg-card border-t border-white/5 pt-16 pb-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-heading font-bold text-lg tracking-wider">
                  APPLYTO<span className="text-primary">BLUE</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                The definitive hiring hub for law enforcement agencies. Connecting departments with the next generation of officers.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </div>
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Browse Jobs</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Agency Directory</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Success Stories</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Candidate FAQ</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Agency FAQ</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Recruiting Guide</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Blog</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ApplytoBlue. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/admin-login">
                <button className="text-[10px] text-muted-foreground/50 hover:text-primary/50 transition-colors opacity-30 hover:opacity-60 font-mono tracking-widest uppercase">
                  [admin]
                </button>
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                System Operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

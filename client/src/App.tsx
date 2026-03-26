import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminAnalytics from "./pages/AdminAnalytics";
import BrowseJobs from "./pages/BrowseJobs";
import AgencyRegister from "./pages/AgencyRegister";
import AgencyLogin from "./pages/AgencyLogin";
import AdminLogin from "./pages/AdminLogin";
import CandidateAuth from "./pages/CandidateAuth";
import CandidateProfile from "./pages/CandidateProfile";
import CandidateProfileView from "./pages/CandidateProfileView";
import AdminCandidateSearch from "./pages/AdminCandidateSearch";
import CandidateMessages from "./pages/CandidateMessages";
import AgencyMessages from "./pages/AgencyMessages";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/agency-register"} component={AgencyRegister} />
        <Route path={"/agency-login"} component={AgencyLogin} />
        <Route path={"/admin-login"} component={AdminLogin} />
        <Route path={"/candidate"} component={CandidateAuth} />
        <Route path={"/browse"} component={BrowseJobs} />
        <Route path={"/dashboard"}>
          {() => (
            <ProtectedRoute requiredType="agency">
              <Dashboard />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/admin"}>
          {() => (
            <ProtectedRoute requiredType="admin">
              <AdminPanel />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/admin/analytics"}>
          {() => (
            <ProtectedRoute requiredType="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/admin/candidates"}>
          {() => (
            <ProtectedRoute requiredType="admin">
              <AdminCandidateSearch />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/profile"}>
          {() => (
            <ProtectedRoute requiredType="candidate">
              <CandidateProfile />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/candidate/:candidateId"} component={CandidateProfileView} />
        <Route path={"/messages"}>
          {() => (
            <ProtectedRoute requiredType="candidate">
              <CandidateMessages />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/agency/messages"}>
          {() => (
            <ProtectedRoute requiredType="agency">
              <AgencyMessages />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/job/:id"} component={JobDetails} />
        <Route path={"/apply/:id"}>
          {() => (
            <ProtectedRoute requiredType="candidate">
              <ApplyJob />
            </ProtectedRoute>
          )}
        </Route>
        <Route path={"/:rest*"} component={NotFound} />
      </Switch>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

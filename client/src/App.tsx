import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DispatchPanel from "./pages/DispatchPanel";
import LeoPanel from "./pages/LeoPanel";
import FireEmsPanel from "./pages/FireEmsPanel";
import UnitStatusBoard from "./pages/UnitStatusBoard";
import CitizensVehicles from "./pages/CitizensVehicles";
import WarrantsBolos from "./pages/WarrantsBolos";
import Reports from "./pages/Reports";
import AdminPanel from "./pages/AdminPanel";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/dispatch"} component={DispatchPanel} />
      <Route path={"/leo"} component={LeoPanel} />
      <Route path={"/fire-ems"} component={FireEmsPanel} />
      <Route path={"/units"} component={UnitStatusBoard} />
      <Route path={"/citizens"} component={CitizensVehicles} />
      <Route path={"/warrants"} component={WarrantsBolos} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

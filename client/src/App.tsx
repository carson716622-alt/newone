import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Officers from "./pages/Officers";
import Shifts from "./pages/Shifts";
import PTO from "./pages/PTO";
import Swaps from "./pages/Swaps";
import Overtime from "./pages/Overtime";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/officers" component={Officers} />
        <Route path="/shifts" component={Shifts} />
        <Route path="/pto" component={PTO} />
        <Route path="/swaps" component={Swaps} />
        <Route path="/overtime" component={Overtime} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

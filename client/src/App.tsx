import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Finances from "@/pages/Finances";
import ShoppingList from "@/pages/ShoppingList";
import Recipes from "@/pages/Recipes";
import CalendarPage from "@/pages/Calendar";
import Receipts from "@/pages/Receipts";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/finances"} component={Finances} />
      <Route path={"/shopping"} component={ShoppingList} />
      <Route path={"/recipes"} component={Recipes} />
      <Route path={"/calendar"} component={CalendarPage} />
      <Route path={"/receipts"} component={Receipts} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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

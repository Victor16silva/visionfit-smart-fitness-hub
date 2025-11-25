import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import UserOnboarding from "./pages/UserOnboarding";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WorkoutSession from "./pages/WorkoutSession";
import CreateWorkout from "./pages/CreateWorkout";
import WorkoutSelection from "./pages/WorkoutSelection";
import PresetWorkouts from "./pages/PresetWorkouts";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full bg-background">
    <main className="w-full">
      <div className="max-w-md mx-auto">{children}</div>
    </main>
    <BottomNav />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/onboarding-form" 
              element={
                <ProtectedRoute>
                  <UserOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Workouts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkoutSession />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout-selection"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkoutSelection />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-workout"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreateWorkout />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/preset-workouts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PresetWorkouts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Progress />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Challenges />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Shop />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:handle"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProductDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

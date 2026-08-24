import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Register } from "@/pages/Register";
import { Paywall } from "@/pages/Paywall";
import { Analytics } from "@/pages/Analytics";
import { Export } from "@/pages/Export";
import { Participants } from "@/pages/Participants";
import { Competitif } from "@/pages/Competitif";
import { MatchDashboard } from "@/pages/MatchDashboard";
import { Tournaments } from "@/pages/Tournaments";
import { TournamentDetail } from "@/pages/TournamentDetail";
import { Admin } from "@/pages/Admin";
import { EventDisplay } from "@/pages/EventDisplay";
import { Home } from "@/pages/Home";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AdminModeProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/register" element={<Register />} />
                <Route path="/paywall/:uid" element={<Paywall />} />
                <Route path="/analytics/:uid" element={<Analytics />} />
                <Route path="/export" element={<Export />} />
                <Route path="/duel" element={<Competitif />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournament/:id" element={<TournamentDetail />} />
              </Route>
              <Route path="/match/:room_id" element={<MatchDashboard />} />
              <Route path="/event" element={<EventDisplay />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AdminModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

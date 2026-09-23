import React, { Suspense, lazy } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, MemoryRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import { ROUTER_MODE } from "@/lib/site";
import ScrollToTop from "@/components/ScrollToTop";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import PropertyDetail from "@/pages/PropertyDetail";
import CityPage from "@/pages/CityPage";
import PageNotFound from "@/pages/PageNotFound";

// Pages most renters never open load on demand, keeping the first load small.
const ListYourPlace = lazy(() => import("@/pages/ListYourPlace"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Keywords = lazy(() => import("@/pages/Keywords"));
const SiteMap = lazy(() => import("@/pages/SiteMap"));
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

const Router = ROUTER_MODE === "memory" ? MemoryRouter : ROUTER_MODE === "hash" ? HashRouter : BrowserRouter;

function Spinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3]" />
    </div>
  );
}

// Links from the old site (/property/:id) keep working.
function LegacyProperty() {
  const { id } = useParams();
  return <Navigate to={`/listing/${id}`} replace />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/listing/:id/:slug?" element={<PropertyDetail />} />
                  <Route path="/property/:id" element={<LegacyProperty />} />
                  <Route path="/apartments/:city" element={<CityPage kind="apartments" />} />
                  <Route path="/rooms-for-rent/:city" element={<CityPage kind="rooms" />} />
                  <Route path="/list-your-place" element={<ListYourPlace />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/keywords" element={<Keywords />} />
                  <Route path="/sitemap" element={<SiteMap />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                  <Route path="*" element={<PageNotFound />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

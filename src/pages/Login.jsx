import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { IS_DEMO } from "@/api/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/api/demoBackend";
import { useSeo } from "@/lib/seo";

// Only allow same-site paths after login (never an outside URL).
function safeReturnTo(value) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  )
    return "/admin";
  return value;
}

export default function Login() {
  useSeo({ title: "Manager sign in", noindex: true });
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const navigate = useNavigate();
  const { signIn, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate(returnTo, { replace: true });
  }, [isAdmin, navigate, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Manager sign in"
      subtitle="For the Apartments4Newark team only."
      footer={
        <Link to="/" className="inline-flex min-h-[44px] items-center font-medium text-[#0071e3] hover:underline">
          ← Back to the site
        </Link>
      }
    >
      {IS_DEMO && (
        <div className="mb-5 flex gap-3 rounded-2xl bg-[#0071e3]/[0.07] p-4 text-[13px] leading-relaxed">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3]" />
          <div>
            <p className="font-semibold">Demo mode</p>
            <p className="text-[#1d1d1f]/80">
              Email <strong>{DEMO_EMAIL}</strong>, password <strong>{DEMO_PASSWORD}</strong>. Changes stay in this
              browser only.
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
              }}
              className="mt-1 font-medium text-[#0071e3] hover:underline"
            >
              Fill in for me
            </button>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-[#0071e3] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, IS_DEMO } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { useSeo } from "@/lib/seo";

export default function ForgotPassword() {
  useSeo({ title: "Reset password", noindex: true });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.requestPasswordReset(email);
    } catch {
      /* same message either way, so this can't be used to check which emails exist */
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="inline-flex min-h-[44px] items-center font-medium text-[#0071e3] hover:underline">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p role="status" className="text-center text-sm">
          {IS_DEMO
            ? "Password reset emails aren't sent in demo mode."
            : "If that email belongs to a manager account, a reset link is on its way. Check your inbox (and spam)."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null} Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

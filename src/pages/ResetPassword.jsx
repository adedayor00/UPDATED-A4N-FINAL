import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { useSeo } from "@/lib/seo";

// Supabase sends managers here from the reset email; the link signs them in
// temporarily so they can choose a new password.
export default function ResetPassword() {
  useSeo({ title: "Choose a new password", noindex: true });
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    try {
      await api.auth.updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      setError(err.message || "That reset link has expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <Link
          to="/forgot-password"
          className="inline-flex min-h-[44px] items-center font-medium text-[#0071e3] hover:underline"
        >
          Request a new link
        </Link>
      }
    >
      {done ? (
        <p role="status" className="text-center text-sm">
          Password updated. Taking you to the dashboard…
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm new password</Label>
            <Input
              id="pw2"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null} Save password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

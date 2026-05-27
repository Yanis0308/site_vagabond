"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "email" | "code";

export default function LoginPage(): ReactNode {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function sendOtp(): Promise<void> {
    setIsLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setIsLoading(false);
    if (otpError !== null) {
      setError(otpError.message);
      return;
    }
    setStep("code");
  }

  async function verifyOtp(): Promise<void> {
    setIsLoading(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setIsLoading(false);
    if (verifyError !== null) {
      setError(verifyError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Saisissez votre email pour recevoir un code à 6 chiffres."
              : `Code envoyé à ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendOtp();
              }}
            >
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                placeholder="vous@vagagond.app"
                autoComplete="email"
                required
              />
              {error !== null && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Envoi…" : "Recevoir le code"}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void verifyOtp();
              }}
            >
              <Input
                inputMode="numeric"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                }}
                placeholder="123456"
                autoComplete="one-time-code"
                required
              />
              {error !== null && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Vérification…" : "Se connecter"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                disabled={isLoading}
              >
                Modifier l&apos;email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

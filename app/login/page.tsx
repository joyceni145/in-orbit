import { redirect } from "next/navigation";
import { CelestialBackground } from "@/components/celestial-background";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signIn } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isSupabaseConfigured()) redirect("/");
  const { error } = await searchParams;

  return (
    <>
      <CelestialBackground fullField />
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="auth-mark" aria-hidden="true">✦</p>
          <h1 id="auth-title">Return to orbit</h1>
          <p>Your library is private. Sign in to continue.</p>
          <form action={signIn}>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit">Enter In Orbit</button>
          </form>
        </section>
      </main>
    </>
  );
}

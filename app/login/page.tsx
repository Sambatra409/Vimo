import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <p className="text-center text-muted-foreground">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

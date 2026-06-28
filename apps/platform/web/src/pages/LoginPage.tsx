import { Button, Card, Field } from "@codexsun/ui";
import { LogIn } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { type Desk, login } from "../api";

type LoginPageProps = {
  desk: Desk;
  title: string;
};

const defaults = {
  admin: {
    email: "admin@codexsun.com",
    password: "admin@123"
  },
  sa: {
    email: "sundar@sundar.com",
    password: "Kalarani1@@"
  },
  tenant: {
    email: "admin@tenant.com",
    password: "admin@123"
  }
};

export function LoginPage({ desk, title }: LoginPageProps) {
  const defaultLogin = defaults[desk];
  const [email, setEmail] = useState(defaultLogin.email);
  const [password, setPassword] = useState(defaultLogin.password);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const targetPath = useMemo(() => {
    if (desk === "sa") {
      return "/sa";
    }

    if (desk === "admin") {
      return "/admin";
    }

    return "/tenant";
  }, [desk]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await login({
        desk,
        email,
        password,
        tenantCode: "test"
      });

      if (!result.success) {
        setMessage(result.error?.message ?? "Login failed");
        return;
      }

      window.location.href = targetPath;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Card description="Use the seeded credentials for this first scaffold." title={title}>
        <form className="auth-form" onSubmit={submit}>
          <Field
            autoComplete="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <Field
            autoComplete="current-password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {desk === "tenant" ? <Field label="Tenant code" name="tenantCode" readOnly value="test" /> : null}
          {message ? <p className="form-error">{message}</p> : null}
          <Button disabled={loading} icon={<LogIn size={16} />} type="submit">
            {loading ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

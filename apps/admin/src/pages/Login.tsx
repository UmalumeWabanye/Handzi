import { useState, type FormEvent } from 'react';
import logoStacked from '../../../../handzi-brand/logo/handzi-logo-stacked.svg';
import { errorText } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button, ErrorBox, Field, Input } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logoStacked} alt="Handzi" className="w-36" />
          <div>
            <h1 className="font-display text-h2">Admin</h1>
            <p className="mt-1 text-small text-hz-steel">Sign in with your admin account.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-hz-line bg-white p-6">
          {error && <ErrorBox message={error} />}
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" variant="primary" className="w-full" loading={busy}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Acessar sistema</h2>
          <p className="mt-2 text-sm text-slate-600">
            Entre com suas credenciais para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="font-semibold text-slate-900 hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

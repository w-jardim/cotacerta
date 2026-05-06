import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
          <p className="mt-2 text-sm text-slate-600">
            Comece a gerenciar suas caixinhas hoje mesmo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Input
            label="Nome completo"
            type="text"
            placeholder="João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

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
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Criar conta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

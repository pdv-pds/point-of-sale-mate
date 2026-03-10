import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;
    setLoading(true);
    try {
      await doLogin({ email: email.trim(), senha });
      navigate('/');
    } catch {
      toast.error('Login ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <ShoppingCart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display">MEUCADINHO</h1>
          <p className="text-muted-foreground text-sm mt-1">Faça login para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Sua senha" />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;

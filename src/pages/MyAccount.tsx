import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { User, Mail, Phone, Lock } from 'lucide-react';

export default function MyAccount() {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, phone').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user.id);
    if (error) toast.error('Erro ao salvar');
    else toast.success('Perfil atualizado!');
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Senha atualizada!');
      setNewPassword('');
    }
    setChangingPassword(false);
  };

  if (authLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <h1 className="section-title mb-8">Minha Conta</h1>

      <div className="card-product p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground" /> Email
          </label>
          <input type="email" value={user.email || ''} disabled className="input-styled opacity-60 cursor-not-allowed" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" /> Nome
          </label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-styled" placeholder="Seu nome completo" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-muted-foreground" /> Telefone
          </label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-styled" placeholder="(00) 00000-0000" />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-hero w-full">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="card-product p-6 mt-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" /> Alterar Senha
        </h2>
        <input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-styled" />
        <button onClick={handlePasswordChange} disabled={changingPassword || !newPassword} className="btn-hero w-full">
          {changingPassword ? 'Atualizando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  );
}

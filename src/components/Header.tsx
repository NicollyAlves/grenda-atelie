import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, User, LogOut, LayoutDashboard, Menu, X, Moon, Sun, Settings, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import CartDrawer from './CartDrawer';
import { useUnreadAdmin } from '@/hooks/useUnreadAdmin';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = useUnreadAdmin();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Padrão agora é Dark
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">Grenda Ateliê</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Início</Link>
          <Link to="/produtos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Produtos</Link>
          {user ? (
            <>
              <Link to="/meus-pedidos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Meus Pedidos</Link>
              <Link to="/minha-conta" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Settings className="h-3.5 w-3.5" /> Conta
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 relative">
                  <LayoutDashboard className="h-4 w-4" /> Admin
                  {unread.total > 0 && (
                    <span className="absolute -top-2.5 -right-3.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-300 shadow-md">
                      {unread.total > 99 ? '99+' : unread.total}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={handleSignOut} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-hero text-sm">
              <User className="h-4 w-4 inline mr-1" /> Entrar
            </Link>
          )}
          
          <CartDrawer />

          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label="Alternar tema">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Alternar tema">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <CartDrawer />
          <button className="text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-border/50 px-6 py-8 space-y-6 animate-in slide-in-from-top duration-300">
          <Link to="/" className="block text-lg font-medium text-foreground" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link to="/produtos" className="block text-lg font-medium text-foreground" onClick={() => setMenuOpen(false)}>Produtos</Link>
          {user ? (
            <>
              <Link to="/meus-pedidos" className="block text-lg font-medium text-foreground" onClick={() => setMenuOpen(false)}>Meus Pedidos</Link>
              <Link to="/minha-conta" className="block text-lg font-medium text-foreground" onClick={() => setMenuOpen(false)}>Minha Conta</Link>
              {isAdmin && (
                <Link to="/admin" className="block text-lg font-medium text-primary flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                  Painel Admin
                  {unread.total > 0 && (
                    <span className="min-w-[20px] h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                      {unread.total > 99 ? '99+' : unread.total}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block text-lg font-medium text-destructive mt-4">Sair da Conta</button>
            </>
          ) : (
            <Link to="/login" className="block btn-hero text-base text-center" onClick={() => setMenuOpen(false)}>Acessar Minha Conta</Link>
          )}
        </div>
      )}
    </header>
  );
}

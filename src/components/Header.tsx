import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">Grenda Ateliê</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Início</Link>
          <Link to="/produtos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Produtos</Link>
          {user ? (
            <>
              <Link to="/meus-pedidos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Meus Pedidos</Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button onClick={handleSignOut} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-hero text-sm">
              <User className="h-4 w-4 inline mr-1" />
              Entrar
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <Link to="/" className="block text-sm font-medium text-foreground" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link to="/produtos" className="block text-sm font-medium text-foreground" onClick={() => setMenuOpen(false)}>Produtos</Link>
          {user ? (
            <>
              <Link to="/meus-pedidos" className="block text-sm font-medium text-foreground" onClick={() => setMenuOpen(false)}>Meus Pedidos</Link>
              {isAdmin && <Link to="/admin" className="block text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>Admin</Link>}
              <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block text-sm font-medium text-muted-foreground">Sair</button>
            </>
          ) : (
            <Link to="/login" className="block btn-hero text-sm text-center" onClick={() => setMenuOpen(false)}>Entrar</Link>
          )}
        </div>
      )}
    </header>
  );
}

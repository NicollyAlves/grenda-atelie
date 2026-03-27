import { ShoppingBag, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">Grenda Ateliê</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Bolsas, mochilas e necessaires feitas à mão com amor e capricho ✨
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/grenda_atelie/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">© 2026 Grenda Ateliê. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

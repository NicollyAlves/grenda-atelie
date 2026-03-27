import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Scissors, Heart, Star } from 'lucide-react';

export default function Index() {
  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('in_stock', true).order('created_at', { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero — clean gradient, no AI image */}
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs font-medium tracking-wider uppercase mb-6">
            ✨ Feito à mão com amor
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4 font-display leading-tight">
            Grenda Ateliê
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-lg mx-auto font-body">
            Bolsas, mochilas e necessaires personalizadas, feitas à mão com amor e capricho
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/produtos" className="btn-hero inline-flex items-center gap-2 bg-primary-foreground text-foreground hover:bg-primary-foreground/90">
              Ver Produtos <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="btn-hero inline-flex items-center gap-2 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              Fale no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            { icon: Scissors, title: 'Feito à Mão', desc: 'Cada peça é única, costurada com dedicação e atenção aos detalhes.' },
            { icon: Heart, title: 'Personalizado', desc: 'Escolha cores, estampas e bordados para deixar sua peça exclusiva.' },
            { icon: Star, title: 'Qualidade', desc: 'Materiais de alta qualidade: couro sintético, PVC e tecidos selecionados.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products Preview */}
      {products && products.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="section-title">Novidades</h2>
              <Link to="/produtos" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title mb-4">Quer algo personalizado?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Entre em contato pelo WhatsApp e encomende sua peça sob medida!
          </p>
          <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="btn-hero inline-flex items-center gap-2">
            Fale no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

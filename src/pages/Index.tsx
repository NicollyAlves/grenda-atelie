import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';
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
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="Grenda Ateliê" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4 font-display">
            Grenda Ateliê
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-lg mx-auto font-body">
            Bolsas, mochilas e necessaires personalizadas, feitas à mão com amor e capricho
          </p>
          <Link to="/produtos" className="btn-hero inline-flex items-center gap-2">
            Ver Produtos <ArrowRight className="h-4 w-4" />
          </Link>
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

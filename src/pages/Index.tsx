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
    <div className="relative overflow-hidden">
      {/* LUXURY HERO — boutique style */}
      <section className="relative min-h-[85vh] flex items-center pt-20 pb-12 overflow-hidden bg-gradient-to-br from-background via-rose-50/20 to-secondary/30">
        {/* Animated Blobs */}
        <div className="absolute top-[-10%] right-[-10%] blob opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] blob opacity-40 animate-float-slow" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* TEXT COLUMN */}
            <div className="text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/10 text-primary text-[11px] md:text-xs font-black tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Feito à mão • Grenda Ateliê
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-8xl lg:text-[8rem] font-bold text-foreground leading-[0.85] tracking-tighter">
                  Grenda <br />
                  <span className="text-primary italic font-serif">Ateliê</span>
                </h1>
                <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Bolsas e acessórios personalizados que traduzem sua essência em <span className="text-foreground font-semibold">arte e costura</span>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link to="/produtos" className="btn-hero group flex items-center gap-3">
                  Explorar Coleção 
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="px-10 py-4 rounded-full border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all text-center">
                  Consultar Encomenda
                </a>
              </div>
            </div>

            {/* 3D STACK COLUMN */}
            <div className="relative hidden lg:block h-[500px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/10 animate-rotate-slow" />
              
              {/* Floating Images Stacks */}
              <div className="relative w-full h-full flex items-center justify-center image-3d-stack">
                {products?.slice(0, 3).map((p, i) => (
                  <div 
                    key={p.id}
                    className={`absolute w-64 h-80 rounded-3xl overflow-hidden glass p-3 border-2 border-white/50 shadow-2xl transition-all duration-700 hover:z-50 hover:scale-105 ${
                      i === 0 ? 'animate-float z-30 rotate-3 -translate-y-10 -translate-x-10' : 
                      i === 1 ? 'animate-float-slow z-20 -rotate-6 translate-y-10 translate-x-20' : 
                      'z-10 rotate-12 -translate-y-32 translate-x-32'
                    }`}
                  >
                    <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                ))}
                
                {/* Rotating Badge Seal */}
                <div className="absolute top-0 right-0 z-40 animate-rotate-slow">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                      <text className="text-[10px] font-bold uppercase tracking-[0.2em] fill-primary/60">
                        <textPath xlinkHref="#circlePath">Artesanal • Qualidade • Grenda Ateliê •</textPath>
                      </text>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary fill-primary/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
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

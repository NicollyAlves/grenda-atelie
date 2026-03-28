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
    <div className="relative min-h-screen">
      {/* HERO SECTION — RESTAURADA COM RESPIRO NAS BORDAS */}
      <section className="relative min-h-[85vh] flex items-center pt-24 pb-12 overflow-hidden bg-gradient-to-br from-rose-50/10 via-transparent to-rose-100/10">
        <div className="container mx-auto px-4 lg:px-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* TEXT COLUMN — AFASTADA DA BORDA ESQUERDA NO DESKTOP */}
            <div className="text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000 lg:pr-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
                Grenda Ateliê • Artesanal
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-8xl lg:text-[7rem] font-bold text-foreground leading-[0.85] tracking-tighter">
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

            {/* IMAGES STACK RESTAURADA */}
            <div className="relative hidden lg:block h-[500px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/10 animate-rotate-slow" />
              
              <div className="relative w-full h-full flex items-center justify-center image-3d-stack">
                {products?.slice(0, 3).map((p, i) => (
                  <div 
                    key={p.id}
                    className={`absolute w-64 h-80 rounded-3xl overflow-hidden bg-white p-2 border-2 border-white/80 shadow-2xl transition-all duration-700 hover:z-50 hover:scale-105 ${
                      i === 0 ? 'animate-float z-30 rotate-3 -translate-y-10 -translate-x-10' : 
                      i === 1 ? 'z-20 -rotate-6 translate-y-10 translate-x-20' : 
                      'z-10 rotate-12 -translate-y-32 translate-x-32 scale-90 opacity-70'
                    }`}
                  >
                    <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                ))}

                {/* HEART BADGE */}
                <div className="absolute top-0 right-10 animate-float">
                  <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-xl rotate-12 group">
                    <Heart className="h-10 w-10 text-primary/40 fill-primary/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Shadow Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features — RESTAURADA SIMPLICIDADE */}
      <section className="py-24 bg-white/50 border-y border-primary/5">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12">
          {[
            { icon: Scissors, title: 'Feito à Mão', desc: 'Cada peça é única, costurada com dedicação e atenção aos detalhes.' },
            { icon: Heart, title: 'Personalizado', desc: 'Escolha cores, estampas e bordados para deixar sua peça exclusiva.' },
            { icon: Star, title: 'Qualidade', desc: 'Materiais de alta qualidade: couro sintético, PVC e tecidos selecionados.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center group p-6 hover:bg-white/40 transition-all rounded-3xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products Selection */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Novidades</h2>
            <Link to="/produtos" className="text-primary font-semibold hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {products?.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Sua Visão, Nossa Arte.</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Gostaria de uma peça sob medida? Entre em contato e vamos criar algo especial.
          </p>
          <div className="flex justify-center">
            <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="btn-hero">
              WhatsApp Direto
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

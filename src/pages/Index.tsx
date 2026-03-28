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
    <div className="relative min-h-screen bg-background isolate">
      {/* ANIMATED MESH BLOBS (Global Background) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      {/* ULTRA-WOW HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
        <div className="container mx-auto px-4 z-10 flex flex-col items-center">
          
          {/* MARQUEE TOP */}
          <div className="absolute top-0 left-0 w-full overflow-hidden whitespace-nowrap bg-primary/5 py-3 border-b border-primary/10 mb-20">
            <div className="inline-block animate-marquee font-black text-[10px] uppercase tracking-[0.5em] text-primary/40">
              Personalizado • Feito à Mão • Único • Sofisticado • Personalizado • Feito à Mão • Único • Sofisticado • Personalizado • Feito à Mão • Único • Sofisticado • 
            </div>
          </div>

          <div className="w-full grid lg:grid-cols-2 gap-8 items-center mt-12">
            
            {/* TYPOGRAPHY COLUMN */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-10 order-2 lg:order-1">
              <div className="space-y-0 text-reveal">
                <h1 className="text-7xl md:text-8xl lg:text-[11rem] font-black leading-[0.75] tracking-tighter uppercase text-foreground">
                  Grenda
                </h1>
                <div className="flex flex-col lg:flex-row items-center lg:items-end gap-2 lg:gap-4 overflow-visible">
                  <h2 className="text-5xl md:text-7xl lg:text-[7rem] font-serif italic text-primary leading-none -mt-2 lg:-mt-6">
                    Ateliê
                  </h2>
                  <div className="h-1 lg:h-3 flex-1 bg-primary/20 rounded-full mb-2 lg:mb-4 hidden lg:block" />
                </div>
              </div>
              
              <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-lg mx-auto lg:mx-0 leading-relaxed text-reveal [animation-delay:200ms]">
                Transformando tecidos e sonhos em <span className="text-foreground font-bold underline decoration-primary/30 decoration-4">acessórios de luxo</span> que contam a sua história.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6 text-reveal [animation-delay:400ms]">
                <Link to="/produtos" className="btn-wow group flex items-center justify-center gap-4">
                  Explorar Agora 
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </Link>
                <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-full border-2 border-primary/20 text-primary font-black hover:bg-primary/5 transition-all text-center uppercase tracking-widest text-sm backdrop-blur-sm">
                  Encomenda Personalizada
                </a>
              </div>
            </div>

            {/* 3D FLOATING STACK (Now also on mobile) */}
            <div className="relative h-[400px] md:h-[600px] w-full order-1 lg:order-2 text-reveal [animation-delay:600ms]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full border-4 border-primary/5 animate-rotate-slow" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] md:w-[300px] md:h-[300px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
              
              <div className="relative w-full h-full flex items-center justify-center image-3d-stack scale-75 md:scale-100">
                {products?.slice(0, 3).map((p, i) => (
                  <div 
                    key={p.id}
                    className={`absolute w-52 h-64 md:w-72 md:h-88 rounded-[2.5rem] overflow-hidden glass-premium p-3 border-4 border-white shadow-2xl transition-all duration-1000 ${
                      i === 0 ? 'animate-float z-30 -rotate-3 -translate-y-10 -translate-x-12' : 
                      i === 1 ? 'animate-float-slow z-20 rotate-6 translate-y-12 translate-x-16' : 
                      'z-10 -rotate-12 -translate-y-36 translate-x-28 scale-90 opacity-60'
                    }`}
                  >
                    <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-[2rem]" />
                  </div>
                ))}

                {/* HEART BADGE FLOATING */}
                <div className="absolute bottom-[-10%] right-[10%] z-50 animate-bounce">
                  <div className="w-20 h-20 md:w-32 md:h-32 glass-premium rounded-full flex items-center justify-center rotate-12 shadow-wow">
                    <Heart className="h-10 w-10 md:h-16 md:h-16 text-primary fill-primary animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MARQUEE INFINITE */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden bg-primary py-4 z-20 shadow-2xl rotate-[-1deg] translate-y-2">
          <div className="inline-block animate-marquee whitespace-nowrap text-primary-foreground font-black text-xs md:text-sm uppercase tracking-[0.6em]">
            EXCLUSIVIDADE • LUXO ACESSÍVEL • ACABAMENTO PREMIUM • FEITO COM AMOR NO ATELIÊ • EXCLUSIVIDADE • LUXO ACESSÍVEL • ACABAMENTO PREMIUM • FEITO COM AMOR NO ATELIÊ • EXCLUSIVIDADE • LUXO ACESSÍVEL • ACABAMENTO PREMIUM • FEITO COM AMOR NO ATELIÊ •
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

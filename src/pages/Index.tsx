import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Scissors, Heart, Star } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function Index() {
  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('in_stock', true).order('created_at', { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="relative min-h-screen bg-background isolate select-none">
      {/* MISTY LAYERED BACKGROUND */}
      <div className="misty-bg opacity-50" />
      
      {/* INTERACTIVE AURA CURSOR */}
      <AuraFollower />

      {/* MINIMALIST HERO — artistic and clean */}
      <section className="relative h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="container mx-auto z-10 text-center space-y-16">
          
          <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-8 py-2 rounded-full border border-primary/20 text-primary text-[10px] md:text-xs font-black tracking-[0.6em] uppercase">
                Grenda Ateliê • Artesanal
              </span>
            </div>
            
            <h1 className="text-luxury leading-[0.7] text-foreground mix-blend-multiply dark:mix-blend-normal">
              Grenda <br />
              <span className="text-primary italic font-serif lowercase tracking-tighter">Ateliê</span>
            </h1>
          </div>

          <div className="flex justify-center pt-8 animate-in fade-in zoom-in duration-1000 delay-500">
            <Link to="/produtos" className="btn-minimal group">
              Explorar Coleção
              <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform rounded-full" />
            </Link>
          </div>
        </div>

        {/* SCROLL INDICATOR */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
          <div className="w-[1px] h-16 bg-gradient-to-b from-primary to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary rotate-90 origin-left mt-8">Scroll</span>
        </div>
      </section>

      {/* Features — Simplified & Artistic */}
      <section className="py-32 relative z-10 bg-white/30 backdrop-blur-xl border-y border-primary/5">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-20">
          {[
            { icon: Scissors, title: 'Criação Única', desc: 'Peças moldadas à mão para refletir sua personalidade singular.' },
            { icon: Heart, title: 'Fio por Fio', desc: 'Cada detalhe é pensado para durar e encantar.' },
            { icon: Star, title: 'Luxo Ético', desc: 'Artesanato sustentável com materiais premium selecionados.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center group space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-primary/10 flex items-center justify-center group-hover:bg-primary/5 transition-all duration-700">
                <Icon className="h-8 w-8 text-primary opacity-60 group-hover:opacity-100" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-black text-foreground uppercase tracking-tight">{title}</h3>
                <p className="text-muted-foreground/60 text-sm leading-relaxed max-w-xs mx-auto italic">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Selection — Capsule Grid */}
      {products && products.length > 0 && (
        <section className="py-40 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
              <div className="space-y-2">
                <span className="text-primary text-xs font-black uppercase tracking-[0.4em]">Seleção Recente</span>
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-foreground leading-none">
                  Cápsulas <br /> <span className="text-primary font-serif italic lowercase font-normal">Premium</span>
                </h2>
              </div>
              <Link to="/produtos" className="btn-minimal">
                Ver Loja Completa
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
              {products.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — Artístic & Minimal */}
      <section className="py-48 bg-primary/5 relative z-10">
        <div className="container mx-auto px-4 text-center space-y-12">
          <div className="relative inline-block">
             <h2 className="text-6xl md:text-[9rem] font-black uppercase tracking-tighter text-foreground leading-[0.8]">
              Sua <br />
              <span className="text-primary italic font-serif lowercase">Encomenda</span>
            </h2>
          </div>
          <p className="text-muted-foreground/60 text-xl font-light italic max-w-lg mx-auto">
            Design exclusivo sob demanda. Projetamos sua visão através do artesanato.
          </p>
          <div className="pt-8">
            <a href="https://wa.me/message/L5LS7YREIUINO1" target="_blank" rel="noopener noreferrer" className="btn-minimal">
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// INTERACTIVE COMPONENT FOR MOUSE FOLLOW (AURA)
function AuraFollower() {
  const [pos, setPos] = useState({ x: -600, y: -600 });
  const [targetPos, setTargetPos] = useState({ x: -600, y: -600 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX - 300, y: e.clientY - 300 });
    };
    window.addEventListener('mousemove', handleMove);
    
    let frameId: number;
    const animate = () => {
      setPos(prev => ({
        x: prev.x + (targetPos.x - prev.x) * 0.08, // Lerp factor for smooth follow
        y: prev.y + (targetPos.y - prev.y) * 0.08,
      }));
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frameId);
    };
  }, [targetPos]);

  return (
    <div 
      className="aura-follower hidden md:block" 
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }} 
    />
  );
}

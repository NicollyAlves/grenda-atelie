import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  stock_quantity?: number;
}

export default function ProductCard({ id, name, price, image_url, category, in_stock, stock_quantity }: Props) {
  return (
    <Link 
      to={`/produto/${id}`} 
      className="group card-capsule block h-full text-center"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-full">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Soft Aura Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {!in_stock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-foreground text-background px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
              Esgotado
            </span>
          </div>
        )}
      </div>
      
      <div className="p-8 md:p-12 space-y-4">
        {category && (
          <span className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em]">
            {category}
          </span>
        )}
        
        <h3 className="font-display text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors duration-500 leading-tight">
          {name}
        </h3>
        
        <div className="flex flex-col items-center gap-4 pt-4">
          <span className="text-2xl md:text-4xl font-serif italic text-primary/80">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}

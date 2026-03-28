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
      className="group card-product block h-full isolate animate-in fade-in slide-in-from-bottom-10 duration-700"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[2rem]">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Luxury Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {!in_stock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-foreground text-background px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
              Esgotado
            </span>
          </div>
        )}
        
        {category && (
          <div className="absolute top-4 left-4 z-10">
            <span className="glass-premium px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-tighter text-primary">
              {category}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-5 md:p-8 space-y-3 relative bg-card rounded-b-[2rem]">
        {/* Glow effect back */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[-1]" />
        
        <h3 className="font-display text-lg md:text-2xl font-black text-foreground group-hover:text-primary transition-colors duration-500 leading-tight line-clamp-1">
          {name}
        </h3>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl md:text-3xl font-serif italic text-primary">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

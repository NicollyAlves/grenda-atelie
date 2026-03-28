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
      className="group card-product block h-full transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-primary/5">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        
        {!in_stock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Esgotado
            </span>
          </div>
        )}
        
        {category && (
          <div className="absolute top-3 left-3">
            <span className="glass px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-primary shadow-sm">
              {category}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-6 space-y-2">
        <h3 className="font-display text-sm md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {name}
        </h3>
        
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg md:text-xl font-bold text-primary">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </div>
      </div>
    </Link>
  );
}

import { ShoppingBag } from 'lucide-react';
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
    <Link to={`/produto/${id}`} className="card-product group">
      <div className="aspect-square overflow-hidden bg-muted relative">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {!in_stock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold">Esgotado</span>
          </div>
        )}
      </div>
      <div className="p-3 md:p-5">
        {category && <span className="badge-category mb-2 inline-block text-[10px] md:text-xs">{category}</span>}
        <h3 className="font-display text-sm md:text-lg font-semibold text-foreground line-clamp-2 leading-tight">{name}</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 md:mt-4 gap-1">
          <span className="text-base md:text-xl font-bold text-primary">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          {in_stock && typeof stock_quantity === 'number' && (
            <span className="text-[10px] md:text-xs text-muted-foreground">
              {stock_quantity > 0 ? `${stock_quantity} em estoque` : 'Sob encomenda'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

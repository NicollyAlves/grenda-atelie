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
      <div className="p-4">
        {category && <span className="badge-category mb-2 inline-block">{category}</span>}
        <h3 className="font-display text-lg font-semibold text-foreground mt-1 line-clamp-2">{name}</h3>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          {in_stock && typeof stock_quantity === 'number' && (
            <span className="text-xs text-muted-foreground">
              {stock_quantity > 0 ? `${stock_quantity} em estoque` : 'Sob encomenda'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

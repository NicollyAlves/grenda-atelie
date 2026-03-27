import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
}

export default function ProductCard({ id, name, price, image_url, category, in_stock }: Props) {
  return (
    <Link to={`/produto/${id}`} className="card-product group">
      <div className="aspect-square overflow-hidden bg-muted">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
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
          {!in_stock && (
            <span className="text-xs text-destructive font-medium">Esgotado</span>
          )}
        </div>
      </div>
    </Link>
  );
}

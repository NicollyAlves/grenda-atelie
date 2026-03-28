import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-foreground/80 hover:text-primary transition-colors">
          <ShoppingBag className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Seu Carrinho
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground mt-1">Que tal dar uma olhada nas nossas bolsas?</p>
              <SheetTrigger asChild>
                <Link to="/produtos" className="btn-hero mt-6 inline-block">Ver Produtos</Link>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.product_id}-${item.variant_id || index}`} className="flex gap-4 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={item.variant?.image_url || item.product?.image_url} 
                      alt={item.product?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-foreground truncate text-sm">{item.product?.name}</h4>
                      <button 
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground mt-0.5">Variação selecionada</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-primary text-sm">
                        R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Subtotal</span>
              <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Frete calculado na finalização do pedido.
            </p>
            <SheetTrigger asChild>
              <Link to="/checkout" className="btn-hero w-full block text-center py-4">
                Finalizar Compra
              </Link>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

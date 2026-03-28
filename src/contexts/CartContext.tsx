import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: any;
  variant?: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart on startup
  useEffect(() => {
    if (user) {
      loadDBCart();
    } else {
      const saved = localStorage.getItem('grenda-cart');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse cart', e);
        }
      }
    }
  }, [user]);

  // Sync guest cart to local storage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('grenda-cart', JSON.stringify(items));
    }
  }, [items, user]);

  const loadDBCart = async () => {
    // In a real app we'd fetch product data too. For simplicity we assume it's loaded in components
    // or we can join here.
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*), variant:product_variants(*)')
      .eq('user_id', user!.id);
    
    if (!error && data) {
      setItems(data);
    } else if (error) {
      console.error('Error loading DB cart:', error);
    }
  };

  const addItem = async (newItem: CartItem) => {
    const existing = items.find(i => 
      i.product_id === newItem.product_id && i.variant_id === newItem.variant_id
    );
    
    if (existing) {
      await updateQuantity(newItem.product_id, newItem.variant_id, existing.quantity + newItem.quantity);
      return;
    }

    if (user) {
      console.log('Adding item to DB cart:', newItem);
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: newItem.product_id,
          variant_id: newItem.variant_id,
          quantity: newItem.quantity
        })
        .select('*, product:products(*), variant:product_variants(*)')
        .single();
      
      if (!error && data) {
        setItems(prev => [...prev, data]);
        toast.success('Adicionado ao carrinho!');
      } else {
        console.error('Error adding to DB cart:', error);
        toast.error('Erro ao adicionar ao carrinho no banco');
      }
    } else {
      console.log('Adding item to guest cart:', newItem);
      // Ensure we have the full product/variant info forguest cart too
      setItems(prev => [...prev, newItem]);
      toast.success('Adicionado ao carrinho (Visitante)!');
    }
  };

  const removeItem = async (productId: string, variantId?: string) => {
    if (user) {
      const query = supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
      if (variantId) {
        query.eq('variant_id', variantId);
      } else {
        query.is('variant_id', null);
      }
      
      const { error } = await query;
      if (error) {
        toast.error('Erro ao remover item');
        return;
      }
    }
    setItems(items.filter(i => !(i.product_id === productId && i.variant_id === variantId)));
  };

  const updateQuantity = async (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId, variantId);
      return;
    }

    if (user) {
      const query = supabase.from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (variantId) {
        query.eq('variant_id', variantId);
      } else {
        query.is('variant_id', null);
      }
      
      const { error } = await query;
      if (error) {
        toast.error('Erro ao atualizar quantidade');
        return;
      }
    }
    setItems(items.map(i => 
      (i.product_id === productId && i.variant_id === variantId) ? { ...i, quantity } : i
    ));
  };

  const clearCart = async () => {
    if (user) {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (error) {
        toast.error('Erro ao limpar carrinho');
        return;
      }
    }
    setItems([]);
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = items.reduce((acc, i) => {
    const price = i.product?.price || 0;
    return acc + (price * i.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

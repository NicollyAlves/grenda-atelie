import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Truck, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const state = location.state as { product: any; quantity: number; notes: string } | null;
  
  const [cep, setCep] = useState('');
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [ordering, setOrdering] = useState(false);
  const [paymentSimulated, setPaymentSimulated] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!state || !state.product) return <Navigate to="/" replace />;
  
  const { product, quantity, notes } = state;
  const productTotal = product.price * quantity;
  const total = productTotal + (shippingFee || 0);

  const calculateShipping = async () => {
    if (cep.length < 8) {
      toast.error('Digite um CEP válido.');
      return;
    }
    setCalculating(true);
    try {
      // Mock de cálculo:
      // Busca CEP na API pública para fingir um cálculo real de estado
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await res.json();
      
      if (data.erro) {
         toast.error('CEP não encontrado.');
         setShippingFee(null);
         return;
      }

      // Lógica Mock: Mesmo estado (ex: SP) = R$ 15, Outros = R$ 45
      // Simulação considerando Ateliê em SP
      const distanceFee = data.uf === 'SP' ? 15.00 : 45.00;
      setShippingFee(distanceFee);
      toast.success(`Frete calculado para ${data.localidade} - ${data.uf}`);
    } catch (error) {
      toast.error('Erro ao calcular frete.');
    } finally {
      setCalculating(false);
    }
  };

  const handleSimulatePayment = () => {
    if (shippingFee === null && paymentMethod !== 'dinheiro') {
      toast.error('Calcule o frete antes de prosseguir.');
      return;
    }
    setPaymentSimulated(true);
    toast.success('Pagamento processado (Simulação)');
  };

  const handleFinishOrder = async () => {
    if (!paymentSimulated && paymentMethod !== 'dinheiro') {
      toast.error('Realize o pagamento antes de confirmar o pedido.');
      return;
    }
    
    setOrdering(true);
    try {
      const finalStatus = paymentMethod === 'dinheiro' ? 'aguardando_pagamento' : 'pendente';
      const finalPaymentStatus = paymentMethod === 'dinheiro' ? 'pendente' : 'pago';

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        user_id: user.id, 
        total, 
        notes: notes || null,
        status: finalStatus,
        payment_method: paymentMethod,
        payment_status: finalPaymentStatus,
        shipping_fee: shippingFee || 0,
      }).select().single();
      
      if (orderErr) throw orderErr;

      const { error: itemErr } = await supabase.from('order_items').insert({
        order_id: order.id, 
        product_id: product.id, 
        quantity, 
        unit_price: product.price,
      });
      if (itemErr) throw itemErr;

      toast.success('Pedido finalizado! O Ateliê já recebeu seu pedido de forma segura.');
      navigate('/meus-pedidos');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao confirmar o pedido.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <h1 className="section-title mb-8">Finalizar Pedido</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Identificação e Frete */}
        <div className="space-y-8">
          
          <div className="card-product p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Entrega
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Informe seu CEP" 
                value={cep} 
                onChange={e => setCep(e.target.value)}
                maxLength={9}
                className="input-styled flex-1"
              />
              <button onClick={calculateShipping} disabled={calculating} className="btn-hero px-6">
                Calcular
              </button>
            </div>
            {shippingFee !== null && (
              <p className="text-sm text-green-600 font-medium">
                Frete fixado: R$ {shippingFee.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <div className="card-product p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Forma de Pagamento</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="accent-primary" />
                <QrCode className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Pix</span>
              </label>
              
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'cartao' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="accent-primary" />
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Cartão de Crédito</span>
              </label>
              
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'dinheiro' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input type="radio" value="dinheiro" checked={paymentMethod === 'dinheiro'} onChange={() => { setPaymentMethod('dinheiro'); setShippingFee(0); setCep(''); }} className="accent-primary" />
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Dinheiro (Retirada Pessoalmente)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lado Direito: Resumo e Pagamento Simulado */}
        <div className="space-y-6">
          <div className="card-product p-6 bg-secondary/30">
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b">
               <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded object-cover" />
               <div className="flex-1">
                 <p className="font-medium">{product.name}</p>
                 <p className="text-sm text-muted-foreground">Qtd: {quantity}</p>
               </div>
            </div>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotalprodutos</span>
                <span>R$ {productTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{shippingFee === null ? 'A calcular' : `R$ ${shippingFee.toFixed(2).replace('.', ',')}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t pt-4">
              <span className="font-medium">Total Geral</span>
              <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {!paymentSimulated && paymentMethod !== 'dinheiro' && (
            <div className="card-product p-6 border-primary/30 bg-primary/5 text-center">
               <h3 className="font-medium mb-2">Ambiente de Pagamento</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Para a segurança do vendedor, confirme o pagamento antes de enviar o pedido.
               </p>
               <button onClick={handleSimulatePayment} className="btn-hero w-full bg-green-600 hover:bg-green-700">
                 Finalizar Pagamento ({paymentMethod.toUpperCase()})
               </button>
            </div>
          )}

          {(paymentSimulated || paymentMethod === 'dinheiro') && (
            <div className="card-product p-6 text-center space-y-4">
               {paymentMethod !== 'dinheiro' && (
                 <div className="text-green-600 flex items-center justify-center gap-2 mb-2 font-medium">
                   <CheckCircle2 className="h-5 w-5" /> Pagamento Aprovado
                 </div>
               )}
               <button onClick={handleFinishOrder} disabled={ordering} className="btn-hero w-full">
                 {ordering ? 'Confirmando...' : 'Confirmar Pedido'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

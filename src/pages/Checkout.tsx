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

  // Calcula a distância usando a fórmula de Haversine (linha reta)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em KM
  };

  const calculateShipping = async () => {
    if (cep.length < 8) {
      toast.error('Digite um CEP válido.');
      return;
    }
    
    setCalculating(true);
    try {
      // 1. Busca os dados de endereço do CEP via ViaCEP
      const cepClean = cep.replace(/\D/g, '');
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      
      if (data.erro) {
         toast.error('CEP não encontrado.');
         setShippingFee(null);
         return;
      }

      // Regra de fallback para entregas fora de Manaus e do Amazonas:
      if (data.uf !== 'AM') {
        setShippingFee(45.00); // Taxa fixa p/ outros estados (ex: Correios)
        toast.success(`Frete fixo para fora do estado (${data.uf})`);
        return;
      }
      
      if (data.localidade !== 'Manaus') {
        setShippingFee(25.00); // Taxa fixa interior do Amazonas
        toast.success(`Frete fixo para Interior do AM (${data.localidade})`);
        return;
      }

      // 2. Tenta pegar a lat/lon exata usando Nominatim (OpenStreetMap)
      // Usamos a rua e o bairro para ter maior precisão, caso falhe tentamos só bairro
      const query = encodeURIComponent(`${data.logradouro}, ${data.bairro}, Manaus, Amazonas, Brasil`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      let geoData = await geoRes.json();

      // Fallback geográfico se a rua for muito nova/desconhecida: procura pelo bairro
      if (!geoData || geoData.length === 0) {
        const fallbackQuery = encodeURIComponent(`${data.bairro}, Manaus, Amazonas, Brasil`);
        const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`);
        geoData = await fallbackRes.json();
      }

      // Coordenadas de origem do Ateliê: Rua São Pedro, 75, Compensa, Manaus
      const ORIGIN_LAT = -3.1118;
      const ORIGIN_LON = -60.0381;

      if (geoData && geoData.length > 0) {
        const destLat = parseFloat(geoData[0].lat);
        const destLon = parseFloat(geoData[0].lon);
        
        const distanceKm = calculateDistance(ORIGIN_LAT, ORIGIN_LON, destLat, destLon);
        
        // Simulação do Uber Moto: R$ 4.00 base + R$ 1.50 por Km + margem pequena(1km)
        // Linha reta tende a ser menor que o trajeto real, então multiplicamos a distância por um fator (ex: 1.3 p/ ruas)
        const realDistanceEstimate = distanceKm * 1.3; 
        const motoFee = 4.00 + (realDistanceEstimate * 1.50);
        
        setShippingFee(Number(motoFee.toFixed(2)));
        toast.success(`Frete Uber Moto calculado! (~${realDistanceEstimate.toFixed(1)} km)`);
      } else {
         // Último caso de "falha" - Endereço não mapeado no AM, usa base fixa local
         setShippingFee(15.00);
         toast.info('Frete local padrão aplicado (Endereço não geolocalizado exato)');
      }

    } catch (error) {
      toast.error('Erro ao calcular frete com GPS. Usando taxa base.');
      setShippingFee(15.00);
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

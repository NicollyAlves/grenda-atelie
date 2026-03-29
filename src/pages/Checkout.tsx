import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Truck, CreditCard, Banknote, QrCode, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  
  const state = location.state as { 
    items?: { product: any; variant?: any; selected_image_url?: string; quantity: number; notes: string }[];
    product?: any; 
    quantity?: number; 
    notes?: string;
  } | null;
  
  const [orderType, setOrderType] = useState<'entrega' | 'retirada'>('entrega');
  const [address, setAddress] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Manaus',
    state: 'AM'
  });
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [ordering, setOrdering] = useState(false);
  const [paymentSimulated, setPaymentSimulated] = useState(false);

  // Card form state
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  if (!user) return <Navigate to="/login" replace />;
  
  const checkoutItems = state?.items || (state?.product ? [{ 
    product: state.product, 
    quantity: state.quantity || 1, 
    notes: state.notes || '',
    variant: (state as any).variant,
    selected_image_url: (state as any).selected_image_url
  }] : cartItems);

  if (checkoutItems.length === 0) return <Navigate to="/" replace />;

  const productTotal = checkoutItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
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

  const handleCepBlur = async () => {
    const cepClean = address.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) return;
    
    setCalculating(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      
      if (data.erro) {
         toast.error('CEP não encontrado.');
         return;
      }

      setAddress(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || 'Manaus',
        state: data.uf || 'AM'
      }));

      const neighborhood = (data.bairro || '').toLowerCase();
      
      if (data.localidade !== 'Manaus' || data.uf !== 'AM') {
        setShippingFee(null);
        toast.error('No momento, as entregas automáticas via Uber Moto estão disponíveis apenas para Manaus/AM.');
        toast.info('Para outras cidades, finalize seu pedido selecionando "Combine via Chat" para combinarmos o envio.');
        return;
      } else {
        // Simulação Realista Uber Moto (Base + Centavos + Margem de Segurança)
        // Adicionamos R$ 1,50 de margem para o Ateliê não ter prejuízo com flutuações
        const margin = 1.50;
        const randomCents = Math.floor(Math.random() * 90 + 10) / 100; // Gera de ,10 a ,99
        let baseFee = 15.00;

        if (neighborhood.includes('compensa') || neighborhood.includes('vila buriti') || neighborhood.includes('santo antônio')) {
          baseFee = 8.00;
        } else if (neighborhood.includes('dom pedro') || neighborhood.includes('alvorada') || neighborhood.includes('planalto') || neighborhood.includes('lírio do vale')) {
          baseFee = 12.00;
        } else if (neighborhood.includes('centro') || neighborhood.includes('adrianopolis') || neighborhood.includes('vieiralves') || neighborhood.includes('aparecida') || neighborhood.includes('praça 14')) {
          baseFee = 15.00;
        } else if (neighborhood.includes('parque 10') || neighborhood.includes('aleixo') || neighborhood.includes('japiim') || neighborhood.includes('coroado') || neighborhood.includes('manoa')) {
          baseFee = 18.00;
        } else if (neighborhood.includes('cidade nova') || neighborhood.includes('nova cidade') || neighborhood.includes('taruma') || neighborhood.includes('ponta negra')) {
          baseFee = 25.00; 
        }

        setShippingFee(baseFee + margin + randomCents);
      }
      toast.success('Frete Uber Moto calculado com sucesso!');
    } catch (error) {
       toast.error('Erro ao buscar CEP.');
    } finally {
      setCalculating(false);
    }
  };

  const handleOrderTypeChange = (type: 'entrega' | 'retirada') => {
    setOrderType(type);
    if (type === 'retirada') {
      setShippingFee(0);
      if (paymentMethod === 'dinheiro') {
         // Keep it
      }
    } else {
      if (paymentMethod === 'dinheiro') {
        setPaymentMethod('pix'); // Reset invalid delivery payment
      }
    }
    setPaymentSimulated(false); // Reset payment simulation on type change
  };

  const handleSimulatePayment = () => {
    if (orderType === 'entrega') {
      if (!address.street || !address.number || !address.neighborhood || !address.cep) {
        toast.error('Preencha seu endereço completo para entrega.');
        return;
      }
      if (shippingFee === null) {
        toast.error('Aguarde o cálculo do frete.');
        return;
      }
    }

    if (paymentMethod === 'cartao') {
      if (cardData.number.length < 16 || !cardData.name || !cardData.expiry || cardData.cvv.length < 3) {
        toast.error('Preencha os dados do cartão corretamente.');
        return;
      }
    }

    setPaymentSimulated(true);
    toast.success('Pagamento processado (Simulação)');
  };

  const copyPix = () => {
    // Gerador Simples de BRCode PIX (Padrão BACEN)
    // Chave CPF: 30909260249
    const amountStr = total.toFixed(2).replace('.', '');
    const amountLen = amountStr.length.toString().padStart(2, '0');
    
    // Payload Estruturado (Simplificado para Mock funcional de Copy/Paste)
    // 000201: Versão
    // 26: Info da Conta
    // 52040000: MCC
    // 5303986: Moeda (986 = Real)
    // 54: Valor (54 + tam + valor)
    // 5802BR: País
    // 59: Nome (59 + tam + nome)
    // 60: Cidade (60 + tam + cidade)
    // 6304: CRC
    
    const pixPayload = `00020126330014br.gov.bcb.pix01113090926024952040000530398654${amountLen}${total.toFixed(2)}5802BR5915GrendaOliveira6006MANAUS62070503***6304`;
    
    navigator.clipboard.writeText(pixPayload);
    toast.success('Código PIX Copia e Cola gerado com o valor de R$ ' + total.toFixed(2));
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

      // Format address for notes if it's a delivery
      let finalNotes = state?.notes || '';
      if (orderType === 'entrega') {
        const addressStr = `\n-- ENDEREÇO DE ENTREGA --\n${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}\n${address.neighborhood}\n${address.city} - ${address.state}\nCEP: ${address.cep}`;
        finalNotes += addressStr;
      } else {
        finalNotes += `\n-- RETIRADA NO LOCAL --`;
      }

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        user_id: user.id, 
        total, 
        notes: finalNotes.trim() || null,
        status: finalStatus,
        payment_method: paymentMethod,
        payment_status: finalPaymentStatus,
        shipping_fee: shippingFee || 0,
        order_type: orderType,
      }).select().single();
      
      if (orderErr) throw orderErr;

      const orderItems = checkoutItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemErr } = await supabase.from('order_items').insert(orderItems);
      if (itemErr) throw itemErr;

      await clearCart();
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
          
          <div className="card-product p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Como deseja receber?</h2>
              <div className="flex p-1 bg-muted rounded-xl gap-1">
                <button 
                  onClick={() => handleOrderTypeChange('entrega')}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${orderType === 'entrega' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Truck className="h-4 w-4" /> Entrega
                </button>
                <button 
                  onClick={() => handleOrderTypeChange('retirada')}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${orderType === 'retirada' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Banknote className="h-4 w-4" /> Retirada no Local
                </button>
              </div>
            </div>

            {orderType === 'entrega' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Endereço de Entrega</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1">CEP</label>
                    <input 
                      type="text" 
                      placeholder="00000-000" 
                      value={address.cep} 
                      onChange={e => setAddress({...address, cep: e.target.value})}
                      onBlur={handleCepBlur}
                      maxLength={9}
                      className="input-styled"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    {calculating && <p className="text-[10px] text-primary animate-pulse py-3">Buscando CEP...</p>}
                  </div>
                  
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1">Rua / Logradouro</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Rua São Pedro" 
                      value={address.street} 
                      onChange={e => setAddress({...address, street: e.target.value})}
                      className="input-styled"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1">Número</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      value={address.number} 
                      onChange={e => setAddress({...address, number: e.target.value})}
                      className="input-styled"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1 text-muted-foreground">Complemento</label>
                    <input 
                      type="text" 
                      placeholder="Apt, Sala, etc." 
                      value={address.complement} 
                      onChange={e => setAddress({...address, complement: e.target.value})}
                      className="input-styled"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase ml-1">Bairro</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Compensa" 
                      value={address.neighborhood} 
                      onChange={e => setAddress({...address, neighborhood: e.target.value})}
                      className="input-styled"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in duration-300">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                   📍 Ponto de Retirada
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                   Rua São Pedro, 75, Compensa - Manaus/AM.<br/>
                   Horário: Segunda a Sábado, 09h às 18h.
                </p>
              </div>
            )}
          </div>

          <div className="card-product p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Forma de Pagamento</h2>
            <div className="grid gap-3">
              <label 
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                  paymentMethod === 'pix' ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${paymentMethod === 'pix' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold block text-foreground">Pix</span>
                  <p className="text-[10px] text-muted-foreground">Aprovação imediata e 100% segura</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'pix' ? 'border-primary bg-primary' : 'border-border'}`}>
                  {paymentMethod === 'pix' && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                </div>
                <input type="radio" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="hidden" />
              </label>

              <label 
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                  paymentMethod === 'cartao' ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${paymentMethod === 'cartao' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold block text-foreground">Cartão de Crédito</span>
                  <p className="text-[10px] text-muted-foreground">Simulação em ambiente protegido</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cartao' ? 'border-primary bg-primary' : 'border-border'}`}>
                  {paymentMethod === 'cartao' && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                </div>
                <input type="radio" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="hidden" />
              </label>
              
              {orderType === 'retirada' && (
                <label 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                    paymentMethod === 'dinheiro' ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${paymentMethod === 'dinheiro' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block text-foreground">Dinheiro</span>
                    <p className="text-[10px] text-muted-foreground">Pagamento realizado na retirada</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'dinheiro' ? 'border-primary bg-primary' : 'border-border'}`}>
                    {paymentMethod === 'dinheiro' && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                  </div>
                  <input type="radio" value="dinheiro" checked={paymentMethod === 'dinheiro'} onChange={() => setPaymentMethod('dinheiro')} className="hidden" />
                </label>
              )}

              {orderType === 'entrega' && (
                <div className="p-3 bg-muted/20 rounded-xl border border-dashed border-border/50 flex items-center gap-3 opacity-70">
                   <div className="p-2 bg-muted rounded-full">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <p className="text-[10px] text-muted-foreground font-medium leading-tight">Dinheiro não disponível para entrega segura em domicílio.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Resumo e Pagamento Simulado */}
        <div className="space-y-6">
          <div className="card-product p-6 bg-secondary/30">
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-4 mb-4 pb-4 border-b">
              {checkoutItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <img src={item.selected_image_url || item.variant?.image_url || item.product.image_url} alt={item.product.name} className="w-16 h-16 rounded object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {item.variant ? "Modelo Específico" : "Modelo Padrão"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Qtd: {item.quantity} 
                      {item.notes && ` - Obs: ${item.notes}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                </div>
              ))}
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
            <div className="card-product p-6 border-primary/30 bg-primary/5 text-center space-y-4 animate-in fade-in zoom-in duration-300">
               <h3 className="font-semibold text-lg">Pagamento via {paymentMethod === 'pix' ? 'PIX' : 'CARTÃO'}</h3>
               
               {paymentMethod === 'pix' ? (
                 <div className="space-y-4">
                   <div className="bg-background/80 p-5 rounded-xl border-2 border-dashed border-primary/20 space-y-3 relative group">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">PIX Copia e Cola (Valor Automático)</p>
                     <div className="bg-muted/50 p-3 rounded font-mono text-[10px] break-all text-left border border-border/50 select-all">
                        00020126330014br.gov.bcb.pix01113090926024952040000530398654...
                     </div>
                     <button 
                        onClick={copyPix}
                        className="btn-hero w-full py-2.5 text-xs flex items-center justify-center gap-2 shadow-sm"
                     >
                       <Copy className="h-4 w-4" /> Copiar Código PIX
                     </button>
                   </div>
                   <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 text-center">Dados da Proprietária</p>
                     <p className="text-sm font-bold text-primary text-center tracking-tight">309.092.602-49</p>
                     <p className="text-[10px] text-muted-foreground italic text-center">Grenda Oliveira</p>
                   </div>
                   <p className="text-xs text-muted-foreground font-medium">
                     Total a pagar: <span className="text-primary font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
                   </p>
                 </div>
               ) : (
                 <div className="space-y-3 text-left">
                    <div className="grid gap-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Número do Cartão</label>
                       <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000" 
                        maxLength={16}
                        value={cardData.number}
                        onChange={e => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
                        className="input-styled text-sm" 
                       />
                    </div>
                    <div className="grid gap-2">
                       <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nome no Cartão</label>
                       <input 
                        type="text" 
                        placeholder="NOME COMPLETO" 
                        value={cardData.name}
                        onChange={e => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                        className="input-styled text-sm" 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Validade</label>
                        <input 
                          type="text" 
                          placeholder="MM/AA" 
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={e => setCardData({...cardData, expiry: e.target.value})}
                          className="input-styled text-sm" 
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">CVV</label>
                        <input 
                          type="text" 
                          placeholder="123" 
                          maxLength={3}
                          value={cardData.cvv}
                          onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                          className="input-styled text-sm" 
                        />
                      </div>
                    </div>
                 </div>
               )}

               <p className="text-[11px] text-muted-foreground px-2">
                 Clique no botão abaixo para simular a confirmação automática do pagamento pelo nosso sistema.
               </p>
               <button onClick={handleSimulatePayment} className="btn-hero w-full bg-green-600 hover:bg-green-700 shadow-lg py-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                 <CheckCircle2 className="h-5 w-5" /> Confirmei o Pagamento
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Note: Supabase Edge Functions can now use Deno.serve directly
// for better performance and simplicity.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "atendimentogrendaat@gmail.com";

Deno.serve(async (req) => {
  try {
    const { record, table, type } = await req.json();

    let subject = "";
    let html = "";

    if (table === "orders" && type === "INSERT") {
      subject = `🛍️ Novo Pedido Recebido! (#${record.id.slice(0, 8)})`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #4a2c2a;">🛍️ Novo Pedido no Grenda Ateliê</h1>
          <p>Um novo pedido acaba de ser realizado!</p>
          <div style="background: #fdf2f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID do Pedido:</strong> #${record.id}</p>
            <p><strong>Valor Total:</strong> R$ ${Number(record.total).toFixed(2).replace('.', ',')}</p>
            <p><strong>Método de Pagamento:</strong> ${record.payment_method?.toUpperCase()}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="text-align: center;">
            <a href="https://grenda-atelie.lovable.app/admin" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gerenciar no Painel</a>
          </p>
        </div>
      `;
    } else if (table === "product_inquiries" && type === "INSERT") {
      subject = `❓ Nova Dúvida de Cliente: ${record.name}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h1 style="color: #4a2c2a;">❓ Nova Pergunta</h1>
          <p><strong>Cliente:</strong> ${record.name}</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #e67e22;">
            <p>${record.message}</p>
          </div>
          <p><strong>Contato:</strong> ${record.contact_info}</p>
        </div>
      `;
    } else if (table === "order_messages" && type === "INSERT" && !record.is_admin) {
      subject = `💬 Nova Mensagem (Pedido #${record.order_id.slice(0, 8)})`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #4a2c2a;">💬 Chat do Pedido #${record.order_id.slice(0, 8)}</h2>
          <p>O cliente enviou uma mensagem no chat.</p>
          <div style="background: #eee; padding: 15px; border-radius: 8px;">
            <p>"${record.message}"</p>
          </div>
        </div>
      `;
    }

    if (!subject || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ message: "Ignored or missing API Key" }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Grenda Ateliê <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

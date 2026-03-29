-- Configuração de Webhooks para Notificações por E-mail
-- Execute este comando no SQL Editor do seu projeto Supabase

-- 1. Habilitar webhooks
ALTER SYSTEM SET "net.http_request_timeout" = 10000;

-- 2. Criar trigger para Novos Pedidos
DROP TRIGGER IF EXISTS on_order_insert_notify ON orders;
CREATE TRIGGER on_order_insert_notify
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'http://localhost:54321/functions/v1/send-notification',
  'POST',
  '{"Content-Type":"application/json"}',
  '{"record": { "id": "' || NEW.id || '", "total": ' || NEW.total || ', "payment_method": "' || NEW.payment_method || '" }, "table": "orders", "type": "INSERT"}'
);

-- Nota: Para ambiente de produção (Cloud), substitua o URL pelo URL da sua Edge Function deployada:
-- https://[PROJETO].supabase.co/functions/v1/send-notification

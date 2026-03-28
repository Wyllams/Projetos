import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_GPxwTD7k_6z4pcF1RJErkSMUzpTbfvDx7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { proposal_id, pdf_url, client_email } = await req.json();

    if (!proposal_id || !pdf_url) {
      throw new Error('proposal_id and pdf_url are required');
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Initialize Supabase admin client to get proposal details if needed
    // But since we just want to send the email with the given PDF url:
    
    // Download the PDF from the URL into memory to attach it
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) {
        throw new Error('Could not download PDF from URL');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    // Resend API body setup
    const toEmails = [];
    if (client_email) {
       toEmails.push(client_email);
    }
    // TODO: also send it to partner_email - if provided. For MVP, just client.
    if (toEmails.length === 0) {
       // Just return success if no one to send to, or you could fail early
       return new Response(JSON.stringify({ message: "No client email to send to; skipped" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const resendReq = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Bravo Homes <propostas@bravohomes.com>', // User needs to authenticate this domain on Resend
        to: toEmails,
        subject: 'Cópia do Orçamento Assinado',
        html: `<p>Olá, a sua proposta foi assinada com sucesso.</p><p>Em anexo você encontrará uma cópia em PDF com a sua assinatura.</p><p>Obrigado,<br/>Bravo Homes</p>`,
        attachments: [
          {
            filename: `proposta-${proposal_id}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    });

    const resendData = await resendReq.json();

    if (!resendReq.ok) {
      throw new Error(JSON.stringify(resendData));
    }

    return new Response(JSON.stringify({ success: true, resendData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

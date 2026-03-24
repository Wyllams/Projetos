import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      name, email, phone, city, service_type, source, status, urgency, notes, captchaToken 
    } = await req.json();

    // 1. Validate CAPTCHA (Using Cloudflare Turnstile as the best modern way)
    // In production, CAPTCHA_SECRET_KEY should be set in Supabase Secrets.
    const secretKey = Deno.env.get("CAPTCHA_SECRET_KEY");
    
    if (secretKey && secretKey !== 'mock_secret_key') {
      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', captchaToken);

      const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      const captchaOutcome = await captchaRes.json();
      
      if (!captchaOutcome.success) {
        return new Response(
          JSON.stringify({ error: 'Falha na verificação de segurança (Captcha).' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // 2. Initialize Supabase Admin Client to bypass RLS for this specific secure insertion
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Insert Client (or find existing)
    // Wait, let's just insert as requested by the original code. 
    // Ideally we match by email/phone first, but for MVP we match original behavior.
    const { data: clientData, error: clientErr } = await supabaseClient
      .from('clients')
      .insert({
        name,
        email,
        phone,
        city,
        state: 'GA'
      })
      .select()
      .single();

    if (clientErr || !clientData) {
      throw new Error('Failed to create client record.');
    }

    // 4. Insert Lead
    const { error: leadErr } = await supabaseClient
      .from('leads')
      .insert({
        client_id: clientData.id,
        service_type,
        city,
        source,
        notes,
        status,
        urgency
      });

    if (leadErr) {
      throw new Error('Failed to create lead record.');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lead captured successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

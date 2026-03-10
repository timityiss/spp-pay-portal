import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!MIDTRANS_SERVER_KEY) {
      throw new Error('MIDTRANS_SERVER_KEY is not configured');
    }

    const { order_id, gross_amount, student_name, description } = await req.json();

    if (!order_id || !gross_amount || !student_name) {
      throw new Error('Missing required fields: order_id, gross_amount, student_name');
    }

    const authString = btoa(MIDTRANS_SERVER_KEY + ':');

    const payload = {
      transaction_details: {
        order_id,
        gross_amount,
      },
      customer_details: {
        first_name: student_name,
      },
      item_details: [
        {
          id: 'spp-payment',
          price: gross_amount,
          quantity: 1,
          name: description || 'SPP Bulanan',
        },
      ],
    };

    // Using Midtrans Sandbox API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Midtrans API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating Midtrans token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

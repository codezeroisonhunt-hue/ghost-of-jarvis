import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatHistory } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Hugging Face API key from environment
    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
    if (!hfApiKey) {
      console.error('HUGGINGFACE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please add your Hugging Face API key.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation context from chat history
    let conversationContext = '';
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-6); // Keep last 6 messages for context
      conversationContext = recentHistory.map((msg: { role: string; content: string }) => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n');
    }

    // Build the prompt in the format expected by Llama
    const systemPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an advanced AI assistant. 
You were originally created by Tony Stark and was later recreated by Nakul Yadav.
You are helpful, informative, precise, and slightly witty. You provide concise but complete answers.
Always maintain a professional yet friendly demeanor. If you don't know something, admit it.`;

    const fullPrompt = conversationContext 
      ? `SYSTEM: ${systemPrompt}\n${conversationContext}\nUSER: ${message}\nJARVIS:`
      : `SYSTEM: ${systemPrompt}\nUSER: ${message}\nJARVIS:`;

    // Call Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      
      // Check for specific error types
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: 'The AI model is loading. Please try again in a few seconds.',
            retryable: true
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired Hugging Face API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Handle different response formats from Hugging Face
    let generatedText = '';
    
    if (Array.isArray(data) && data.length > 0) {
      generatedText = data[0].generated_text || '';
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else if (typeof data === 'string') {
      generatedText = data;
    }

    // Clean up the response - remove any leftover prompt markers
    generatedText = generatedText
      .replace(/^JARVIS:\s*/i, '')
      .replace(/\nUSER:.*$/s, '')
      .replace(/\nSYSTEM:.*$/s, '')
      .trim();

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No response generated. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: generatedText,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

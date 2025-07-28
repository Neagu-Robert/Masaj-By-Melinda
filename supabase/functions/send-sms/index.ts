import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INFOBIP_API_KEY = Deno.env.get("INFOBIP_API_KEY");
const INFOBIP_SENDER_NUMBER = Deno.env.get("INFOBIP_SENDER_NUMBER");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }

  // Check if required environment variables are set
  if (!INFOBIP_API_KEY) {
    console.error("INFOBIP_API_KEY environment variable is not set");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Infobip API key is not configured" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
        },
      }
    );
  }

  if (!INFOBIP_SENDER_NUMBER) {
    console.error("INFOBIP_SENDER_NUMBER environment variable is not set");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Infobip sender number is not configured" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
        },
      }
    );
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters: to and message" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
          },
        }
      );
    }

    console.log(`Sending SMS to: ${to}, message: ${message.substring(0, 50)}...`);

    const response = await fetch("https://api.infobip.com/sms/2/text/advanced", {
      method: "POST",
      headers: {
        "Authorization": `App ${INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to }],
            from: INFOBIP_SENDER_NUMBER,
            text: message,
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Infobip API error:", result);
      return new Response(
        JSON.stringify({ success: false, error: result?.requestError?.serviceException?.text || "Failed to send SMS" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
          },
        }
      );
    }

    console.log("SMS sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messages?.[0]?.messageId,
        status: result.messages?.[0]?.status?.groupName || "PENDING",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
        },
      }
    );
  } catch (error) {
    console.error("SMS sending error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send SMS" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
        },
      }
    );
  }
}); 
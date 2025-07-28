import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@masajbymelinda.com";
const SENDGRID_FROM_NAME = Deno.env.get("SENDGRID_FROM_NAME") || "Masaj_by_Melinda";

console.log("=== SENDGRID EMAIL FUNCTION LOADED ===");
console.log("Environment check:", {
  hasApiKey: !!SENDGRID_API_KEY,
  apiKeyLength: SENDGRID_API_KEY?.length || 0,
  apiKeyStart: SENDGRID_API_KEY?.substring(0, 10) || "NONE",
  fromEmail: SENDGRID_FROM_EMAIL,
  fromName: SENDGRID_FROM_NAME
});

serve(async (req) => {
  console.log("=== EMAIL REQUEST RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
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

  try {
    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    
    const { to, subject, htmlContent, textContent } = body;

    console.log("Validating parameters...");
    if (!to || !subject || !htmlContent) {
      console.error("Missing parameters:", { to, subject, hasHtml: !!htmlContent });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required parameters",
          details: { to, subject, hasHtml: !!htmlContent }
        }),
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

    console.log("Checking API key...");
    if (!SENDGRID_API_KEY) {
      console.error("API key missing!");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SendGrid API key is not configured",
          details: "SENDGRID_API_KEY environment variable is missing"
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

    console.log("Preparing SendGrid request...");
    const sendGridBody = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject,
        },
      ],
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      content: [
        {
          type: "text/html",
          value: htmlContent,
        },
        ...(textContent ? [{
          type: "text/plain",
          value: textContent,
        }] : []),
      ],
    };

    console.log("SendGrid request body:", JSON.stringify(sendGridBody, null, 2));

    console.log("Making SendGrid API call...");
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridBody),
    });

    console.log("SendGrid response status:", response.status);
    const result = await response.json();
    console.log("SendGrid response:", result);

    if (!response.ok) {
      console.error("SendGrid API error:", result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SendGrid API error",
          details: {
            status: response.status,
            statusText: response.statusText,
            sendGridError: result
          }
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

    console.log("Email sent successfully!");
    return new Response(
      JSON.stringify({
        success: true,
        messageId: result?.id || `email_${Date.now()}`,
        status: "SENT",
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
    console.error("=== EMAIL ERROR OCCURRED ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Email function error",
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          errorStack: error.stack
        }
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
});
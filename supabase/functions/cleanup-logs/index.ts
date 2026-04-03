// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    // Compute threshold: 60 days before now
    const threshold = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Delete old admin audit logs
    const { error: delAuditError, count: auditLogsDeleted } = await supabase
      .from('admin_audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', threshold);

    if (delAuditError) {
      throw new Error(`Error deleting old admin_audit_logs: ${delAuditError.message}`);
    }

    // Delete old notification logs
    const { error: delNotifError, count: notificationLogsDeleted } = await supabase
      .from('notification_logs')
      .delete({ count: 'exact' })
      .lt('sent_at', threshold);

    if (delNotifError) {
      throw new Error(`Error deleting old notification_logs: ${delNotifError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        audit_logs_deleted: auditLogsDeleted || 0,
        notification_logs_deleted: notificationLogsDeleted || 0,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

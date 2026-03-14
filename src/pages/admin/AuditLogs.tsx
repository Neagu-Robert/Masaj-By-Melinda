import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";


type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string;
  } | null;
};

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch audit logs
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Nu s-au putut încărca jurnalele de audit');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueTargetTypes = Array.from(new Set(logs.map(log => log.target_type)));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTargetType = targetTypeFilter === "all" || log.target_type === targetTypeFilter;
    const matchesSearch = !searchQuery || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesAction && matchesTargetType && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-violet-400">Jurnale de Audit</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
          >
            <SelectTrigger className="bg-gray-800/50 text-white border-gray-700">
              <SelectValue placeholder="Toate Acțiunile" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800/90 text-white">
              <SelectItem value="all">Toate Acțiunile</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={targetTypeFilter}
            onValueChange={setTargetTypeFilter}
          >
            <SelectTrigger className="bg-gray-800/50 text-white border-gray-700">
              <SelectValue placeholder="Toate Tipurile" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800/90 text-white">
              <SelectItem value="all">Toate Tipurile</SelectItem>
              {uniqueTargetTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            placeholder="Caută în detalii sau utilizator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800/50 text-white border-gray-700"
          />
        </div>
      </div>

      {/* Logs Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Se încarcă jurnalele de audit...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-gray-800 bg-gray-800/50 shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white w-1/4">Dată</TableHead>
                  <TableHead className="text-white w-1/4">Admin</TableHead>
                  <TableHead className="text-white w-1/4">Acțiune</TableHead>
                  <TableHead className="text-white w-1/4">Tip Țintă</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-400">
                      Nu s-au găsit jurnale de audit
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-gray-700">
                      <TableCell className="text-gray-300">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">
                        <div>{log.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{log.profiles?.email || 'Utilizator Șters'}</div>
                      </TableCell>
                      <TableCell className="text-gray-300">{log.action}</TableCell>
                      <TableCell className="text-gray-300">{log.target_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nu s-au găsit jurnale de audit
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">Dată</div>
                        <div className="text-white text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Acțiune</div>
                        <div className="text-violet-300 text-sm font-medium">
                          {log.action}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">Admin</div>
                        <div className="text-white text-sm">
                          <div>{log.profiles?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{log.profiles?.email || 'Utilizator Șters'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Țintă</div>
                        <div className="text-gray-300 text-sm">
                          {log.target_type}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 
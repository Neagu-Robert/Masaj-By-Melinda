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
  };
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
      setError('Failed to load audit logs');
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
      log.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesAction && matchesTargetType && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-violet-400">Audit Logs</h2>
      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
          >
            <SelectTrigger className="bg-gray-800/50 text-white border-gray-700">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800/90 text-white">
              <SelectItem value="all">All Actions</SelectItem>
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
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800/90 text-white">
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTargetTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            placeholder="Search in details or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800/50 text-white border-gray-700"
          />
        </div>
      </div>
      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading audit logs...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="rounded-lg border border-gray-800 bg-gray-800/50 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white w-1/4">Date</TableHead>
                <TableHead className="text-white w-1/4">Admin</TableHead>
                <TableHead className="text-white w-1/4">Action</TableHead>
                <TableHead className="text-white w-1/4">Target Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-400">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-b border-gray-700">
                    <TableCell className="text-gray-300">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">
                      <div>{log.profiles.full_name}</div>
                      <div className="text-sm text-gray-500">{log.profiles.email}</div>
                    </TableCell>
                    <TableCell className="text-gray-300">{log.action}</TableCell>
                    <TableCell className="text-gray-300">{log.target_type}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 
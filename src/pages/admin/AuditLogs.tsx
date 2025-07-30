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
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>(undefined);
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
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesTargetType = !targetTypeFilter || log.target_type === targetTypeFilter;
    const matchesSearch = !searchQuery || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesAction && matchesTargetType && matchesSearch;
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Audit Logs</h2>

      {/* Notification System Status */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Notification System Status</h3>

      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <Select
            value={actionFilter}
            onValueChange={v => setActionFilter(v === "" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={targetTypeFilter}
            onValueChange={v => setTargetTypeFilter(v === "" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
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
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">Loading audit logs...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>{log.profiles.full_name}</div>
                      <div className="text-sm text-gray-500">{log.profiles.email}</div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.target_type}</TableCell>
                    <TableCell className="font-mono text-sm">{log.target_id}</TableCell>
                    <TableCell>{log.details}</TableCell>
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
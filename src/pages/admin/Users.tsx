import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logAdminAction } from "@/lib/audit-logger";
import { useAuth } from "@/contexts/AuthContext";

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const { user } = useAuth(); // get current admin

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from profiles table with auth data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userToUpdate: User, newStatus: 'active' | 'banned') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userToUpdate.id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userToUpdate.id ? { ...u, status: newStatus } : u
      ));

      toast.success(`Utilizator ${newStatus === 'banned' ? 'blocat' : 'deblocat'} cu succes`);

      console.log("[AuditLog] Attempting to log action:", {
        adminId: user?.id,
        action: newStatus === 'banned' ? 'user.ban' : 'user.unban',
        targetUserId: userToUpdate.id,
        targetUserEmail: userToUpdate.email
      });

      if (!user?.id) {
        console.error('[AuditLog] No admin user id available, skipping log.');
        return;
      }

      await logAdminAction(
        user.id,
        newStatus === 'banned' ? 'user.ban' : 'user.unban',
        "user",
        userToUpdate.id,
        `User status for ${userToUpdate.email} changed to ${newStatus}`
      );
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Eroare la actualizarea statusului utilizatorului');
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    try {
      // Call our edge function to delete the user
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (deleteError) throw deleteError;

      // Update local state
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast.success('Utilizator șters cu succes');
      
      console.log("[AuditLog] Attempting to log DELETE:", {
          adminId: user?.id,
          targetUserId: userToDelete.id,
          targetUserEmail: userToDelete.email
      });
      
      if (!user?.id) {
          console.error('[AuditLog] No admin user id available, skipping log.');
          return;
      }

      await logAdminAction(
        user.id,
        "user.delete",
        "user",
        userToDelete.id,
        `Deleted user ${userToDelete.email}`
      );
    } catch (err) {
      console.error('Error deleting user:', err);
      if (err.message?.includes('foreign key constraint')) {
        toast.error('Nu se poate șterge utilizatorul: Are date asociate');
      } else if (err.message?.includes('Unauthorized')) {
        toast.error('Nu aveți permisiunea de a șterge utilizatori');
      } else if (err.message?.includes('Can only delete customer accounts')) {
        toast.error('Nu se pot șterge conturile de administrator');
      } else {
        toast.error('Eroare la ștergerea utilizatorului');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full bg-gray-900 text-violet-400">Se încarcă utilizatorii...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center bg-gray-900">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-violet-400">Gestionare Utilizatori</h2>
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Nume</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Rol</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Creat La</TableHead>
              <TableHead className="text-white">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b border-gray-700">
                <TableCell className="text-gray-300">{user.full_name}</TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell className="text-gray-300">{user.role}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'banned' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.status === 'banned' ? 'blocat' : user.status || 'activ'}
                  </span>
                </TableCell>
                <TableCell className="text-gray-400">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {user.role === 'customer' && (
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={user.status === 'banned' ? 'text-green-600' : 'text-red-600'}
                            onClick={() => setSelectedUser(user)}
                          >
                            {user.status === 'banned' ? 'Deblochează' : 'Blochează'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800/90 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.status === 'banned' ? 'Deblochează Utilizatorul' : 'Blochează Utilizatorul'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.status === 'banned' ? 'Sigur doriți să deblocați acest utilizator?' : 'Sigur doriți să blocați acest utilizator?'}
                              {user.status !== 'banned' && " Nu vor mai putea accesa contul lor."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUpdateUserStatus(user, user.status === 'banned' ? 'active' : 'banned')}
                              className={user.status === 'banned' ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {user.status === 'banned' ? 'Deblochează' : 'Blochează'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setSelectedUser(user)}
                          >
                            Șterge
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800/90 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Șterge Utilizatorul</AlertDialogTitle>
                            <AlertDialogDescription>
                              Aceasta va șterge permanent contul utilizatorului și toate datele asociate. Această acțiune nu poate fi anulată.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user)}
                              className="bg-red-600"
                            >
                              Șterge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 
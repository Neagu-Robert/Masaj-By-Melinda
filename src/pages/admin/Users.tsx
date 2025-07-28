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

      toast.success(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`);

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
      toast.error('Failed to update user status');
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
      toast.success('User deleted successfully');
      
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
        toast.error('Cannot delete user: They have associated data');
      } else if (err.message?.includes('Unauthorized')) {
        toast.error('You do not have permission to delete users');
      } else if (err.message?.includes('Can only delete customer accounts')) {
        toast.error('Cannot delete admin accounts');
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'banned' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
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
                            {user.status === 'banned' ? 'Unban' : 'Ban'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to {user.status === 'banned' ? 'unban' : 'ban'} this user?
                              {user.status !== 'banned' && " They will no longer be able to access their account."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUpdateUserStatus(user, user.status === 'banned' ? 'active' : 'banned')}
                              className={user.status === 'banned' ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {user.status === 'banned' ? 'Unban' : 'Ban'}
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
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user's account and all associated data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user)}
                              className="bg-red-600"
                            >
                              Delete
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
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentPhone: string | null;
  onSuccess: (newName: string, newPhone: string | null) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, userId, currentName, currentPhone, onSuccess }) => {
  const [fullName, setFullName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', userId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      onSuccess(fullName.trim(), phone.trim() || null);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-gray-900 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-violet-400 text-center">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 text-sm md:text-base">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full bg-gray-800 text-white h-12 md:h-10 text-base md:text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 text-sm md:text-base">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full bg-gray-800 text-white h-12 md:h-10 text-base md:text-sm"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto h-12 md:h-10">
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto h-12 md:h-10" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { changePassword, validatePassword, doPasswordsMatch } from '@/services/auth/passwordReset';

interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PasswordChangeModal({ open, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setLoading(true);

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setValidationErrors(passwordValidation.errors);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (!doPasswordsMatch(newPassword, confirmPassword)) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess(result.message);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || result.message);
    }

    setLoading(false);
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setValidationErrors([]);
    onClose();
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Change Password</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your current password and choose a new password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium text-gray-200">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-gray-200">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                disabled={loading}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-[#7E69AB]"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded p-3">
              {success}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
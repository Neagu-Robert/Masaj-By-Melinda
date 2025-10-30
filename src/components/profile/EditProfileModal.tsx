import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';
import { usePhoneVerification } from '@/contexts/PhoneVerificationContext';
import { toast } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentPhone: string | null;
  isPhoneVerified: boolean;
  onSuccess: (newName: string, newPhone: string | null) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  userId,
  currentName,
  currentPhone,
  isPhoneVerified: initialIsVerified,
  onSuccess,
}) => {
  const [prenume, setPrenume] = useState('');
  const [nume, setNume] = useState('');
  const [phone, setPhone] = useState(currentPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(initialIsVerified);
  const [showChangePhoneConfirmation, setShowChangePhoneConfirmation] = useState(false);
  const [isPhoneEditable, setIsPhoneEditable] = useState(!initialIsVerified);
  
  const { startVerification, verificationStatus, isVerified } = usePhoneVerification();

  useEffect(() => {
    const nameParts = currentName.split(' ');
    setPrenume(nameParts[0] || '');
    setNume(nameParts.slice(1).join(' ') || '');
    setPhoneVerified(initialIsVerified);
    setIsPhoneEditable(!initialIsVerified);
    setPhone(currentPhone || '');
  }, [currentName, initialIsVerified, currentPhone]);

  const handleVerifyClick = async () => {
    const success = await startVerification(phone, userId);
    if (success) {
      setIsModalOpen(true);
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Normalize like the context: strip non-digits, then leading 40 or 0, expect 9 digits
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('40')) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    const normalized = digits.length === 9 ? `+40${digits}` : null;
    if (normalized && isVerified(normalized)) {
      setPhoneVerified(true);
      toast.success("Succes", { description: "Număr de telefon verificat cu succes." });
      // Update parent profile state and close the edit modal so the profile page is shown
      const fullName = `${prenume.trim()} ${nume.trim()}`.trim();
      onSuccess(fullName, normalized);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullName = `${prenume.trim()} ${nume.trim()}`;
    if (!fullName.trim()) {
      setError('Prenumele și numele sunt obligatorii.');
      return;
    }
    
    // If phone number has changed and is not verified, block submission
    if (phone.trim() !== (currentPhone || '') && !phoneVerified) {
      setError('Vă rugăm să verificați noul număr de telefon înainte de salvare.');
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

  const handleConfirmChangePhone = () => {
    setIsPhoneEditable(true);
    setPhoneVerified(false);
    setShowChangePhoneConfirmation(false);
  };

  if (!open) return null;

  const phoneHasChanged = phone.trim() !== (currentPhone || '');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
        <div className="bg-gray-900 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-violet-400 text-center">Editează Profilul</h2>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm md:text-base">Prenume</label>
                <Input
                  type="text"
                  value={prenume}
                  onChange={(e) => setPrenume(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white h-12 md:h-10 text-base md:text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm md:text-base">Nume</label>
                <Input
                  type="text"
                  value={nume}
                  onChange={(e) => setNume(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white h-12 md:h-10 text-base md:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 text-sm md:text-base">Număr de Telefon</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                    if (e.target.value.trim() !== (currentPhone || '')) {
                      setPhoneVerified(false);
                    } else {
                      setPhoneVerified(initialIsVerified);
                    }
                  }}
                  placeholder="Introduceți un număr de telefon valid"
                  className="w-full bg-gray-800 text-white h-12 md:h-10 text-base md:text-sm"
                  disabled={!isPhoneEditable}
                />
                {phone && isPhoneEditable && (!phoneVerified || phoneHasChanged) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyClick}
                    disabled={phone.length < 10 || verificationStatus === 'pending'}
                    className="h-12 md:h-10 text-sm md:text-base bg-white text-gray-500 hover:text-black"
                  >
                    {verificationStatus === 'pending' ? 'Se trimite...' : 'Verifică'}
                  </Button>
                )}
              </div>
              {phone && phoneVerified && !isPhoneEditable && (
                <div className="mt-2">
                  <p className="text-sm text-green-400">Numărul de telefon este verificat.</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowChangePhoneConfirmation(true)}
                    className="p-0 h-auto text-violet-400 hover:text-violet-300"
                  >
                    Schimbă numărul de telefon
                  </Button>
                </div>
              )}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto h-12 md:h-10">
                Anulează
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto h-12 md:h-10" disabled={loading}>
                {loading ? 'Se salvează...' : 'Salvează Modificările'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <PhoneVerificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        phoneNumber={phone}
      />
      <AlertDialog open={showChangePhoneConfirmation} onOpenChange={setShowChangePhoneConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Numărul de telefon este deja verificat, dacă îl schimbați va trebui să-l verificați din nou.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Înapoi</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChangePhone}>Schimbă numărul</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditProfileModal; 
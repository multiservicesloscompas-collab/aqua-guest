import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const LogoutButton = ({
  variant = 'ghost',
  size = 'default',
  className = '',
  showIcon = true,
  showText = true,
}: LogoutButtonProps) => {
  const navigate = useNavigate();
  const { signOut } = useAppStore();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada exitosamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={className}
    >
      {showIcon && <LogOut className={showText ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />}
      {showText && 'Cerrar Sesión'}
    </Button>
  );
};

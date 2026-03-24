import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { AppRoute } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { userManagementService } from '@/services/UserManagementService';
import { UserProfile } from '@/types/auth';
import { toast } from 'sonner';
import { UsersList } from './components/UsersList';
import { CreateUserDialog } from './components/CreateUserDialog';

interface UsersPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function UsersPage({ onNavigate }: UsersPageProps) {
  const { user } = useAppStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const usersList = await userManagementService.listUsers(user);
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = () => {
    setCreateDialogOpen(false);
    loadUsers();
    toast.success('Usuario creado exitosamente');
  };

  // Verificar permisos
  if (!user || user.role === 'employee') {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header title="Usuarios" onBack={() => onNavigate('dashboard')} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header title="Gestión de Usuarios" onBack={() => onNavigate('dashboard')} />

      <div className="flex-1 overflow-auto pb-20">
        <div className="p-4 space-y-4">
          {/* Header con botón crear */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {user.role === 'admin' ? 'Todos los usuarios' : 'Empleados'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </div>

          {/* Lista de usuarios */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay usuarios registrados
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear primer usuario
              </Button>
            </div>
          ) : (
            <UsersList users={users} onUserUpdated={loadUsers} currentUser={user} />
          )}
        </div>
      </div>

      {/* Dialog para crear usuario */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={handleUserCreated}
        currentUser={user}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, Plus } from 'lucide-react';
import { UserProfile, Company } from '@/types/auth';
import { userManagementService } from '@/services/UserManagementService';
import { toast } from 'sonner';
import { getTenantClient } from '@/lib/supabaseClient';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
  currentUser: UserProfile;
}

export function CreateUserDialog({ open, onOpenChange, onUserCreated, currentUser }: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompany, setShowNewCompany] = useState(false);

  // Datos del usuario
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin'>('owner');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Datos de nueva empresa
  const [companyName, setCompanyName] = useState('');
  const [companyRif, setCompanyRif] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  useEffect(() => {
    if (open && currentUser.role === 'admin') {
      loadCompanies();
    }
  }, [open, currentUser.role]);

  const loadCompanies = async () => {
    try {
      const companiesList = await userManagementService.listCompanies();
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Error al cargar empresas');
    }
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setFullName('');
    setSelectedRole('owner');
    setSelectedCompanyId('');
    setCompanyName('');
    setCompanyRif('');
    setCompanyAddress('');
    setCompanyPhone('');
    setShowNewCompany(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    // Solo validar empresa si el rol seleccionado es 'owner'
    if (currentUser.role === 'admin' && selectedRole === 'owner' && !selectedCompanyId && !showNewCompany) {
      toast.error('Debes seleccionar o crear una empresa para un dueño');
      return;
    }

    if (showNewCompany && (!companyName || !companyRif)) {
      toast.error('Nombre y RIF de la empresa son requeridos');
      return;
    }

    setIsLoading(true);

    try {
      let companyId = selectedCompanyId;

      // Si es admin y está creando una nueva empresa
      if (currentUser.role === 'admin' && showNewCompany) {
        const newCompany = await userManagementService.createCompany({
          name: companyName,
          rif: companyRif,
          address: companyAddress,
          phone: companyPhone,
        });
        companyId = newCompany.id;
      }

      // Si es owner quien crea, usar su empresa
      if (currentUser.role === 'owner') {
        companyId = currentUser.companyId!;
      }

      // Si el admin está creando un admin, no debe tener company_id
      if (currentUser.role === 'admin' && selectedRole === 'admin') {
        companyId = '';
      }

      // Crear usuario en auth.users usando signUp
      const supabase = getTenantClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Actualizar perfil en user_profiles (el trigger handle_new_user ya lo creó)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: username || null,
          full_name: fullName || null,
          role: currentUser.role === 'admin' ? selectedRole : 'employee',
          company_id: companyId || null,
          created_by: currentUser.id,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      toast.success('Usuario creado exitosamente');
      resetForm();
      onUserCreated();
    } catch (error: any) {
      console.error('Error creating user:', error);

      if (error.message?.includes('User already registered')) {
        toast.error('El email ya está registrado');
      } else if (error.message?.includes('duplicate key') && error.message?.includes('username')) {
        toast.error('El username ya está en uso');
      } else if (error.message?.includes('duplicate key') && error.message?.includes('email')) {
        toast.error('El email ya está registrado');
      } else if (error.code === '23505') {
        // Código PostgreSQL para unique violation
        if (error.message?.includes('user_profiles_username_key')) {
          toast.error('El username ya está en uso');
        } else if (error.message?.includes('user_profiles_email_key')) {
          toast.error('El email ya está registrado');
        } else {
          toast.error('Ya existe un usuario con esos datos');
        }
      } else {
        toast.error('Error al crear usuario: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentUser.role === 'admin'
              ? 'Crear Usuario'
              : 'Crear Empleado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Usuario (opcional)</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombreusuario"
              disabled={isLoading}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez"
              disabled={isLoading}
            />
          </div>

          {/* Selector de Rol (solo para admin) */}
          {currentUser.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuario *</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: 'owner' | 'admin') => {
                  setSelectedRole(value);
                  // Si cambia a admin, limpiar empresa seleccionada
                  if (value === 'admin') {
                    setSelectedCompanyId('');
                    setShowNewCompany(false);
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Dueño</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Empresa (solo para admin creando owner) */}
          {currentUser.role === 'admin' && selectedRole === 'owner' && (
            <>
              <div className="space-y-2">
                <Label>Empresa *</Label>
                {!showNewCompany ? (
                  <div className="space-y-2">
                    <Select
                      value={selectedCompanyId}
                      onValueChange={setSelectedCompanyId}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} - {company.rif}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCompany(true)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear nueva empresa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Nueva Empresa
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewCompany(false)}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <Input
                      placeholder="Nombre de la empresa *"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="RIF *"
                      value={companyRif}
                      onChange={(e) => setCompanyRif(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="Dirección (opcional)"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="Teléfono (opcional)"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Info para owner */}
          {currentUser.role === 'owner' && currentUser.company && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                El empleado será asignado a: <strong>{currentUser.company.name}</strong>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { UserProfile, USER_ROLE_LABELS } from '@/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Building2, UserCircle } from 'lucide-react';

interface UsersListProps {
  users: UserProfile[];
  onUserUpdated: () => void;
  currentUser: UserProfile;
}

export function UsersList({ users }: UsersListProps) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Nombre y rol */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold truncate">
                    {user.fullName || 'Sin nombre'}
                  </h3>
                  <Badge variant="secondary" className="shrink-0">
                    {USER_ROLE_LABELS[user.role]}
                  </Badge>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                {/* Username */}
                {user.username && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <UserCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">@{user.username}</span>
                  </div>
                )}

                {/* Empresa */}
                {user.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{user.company.name}</span>
                  </div>
                )}

                {/* Creado por */}
                {user.createdBy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      Creado: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

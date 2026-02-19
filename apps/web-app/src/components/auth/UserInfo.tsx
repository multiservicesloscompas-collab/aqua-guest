import { useAuth } from '@/hooks/useAuth';
import { UserRoleLabels } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface UserInfoProps {
  showRole?: boolean;
  showEmail?: boolean;
  className?: string;
}

export const UserInfo = ({
  showRole = true,
  showEmail = true,
  className = '',
}: UserInfoProps) => {
  const { user } = useAuth();

  if (!user) return null;

  const roleColors = {
    admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    employee: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    client: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-500" />
        <div className="flex flex-col">
          {user.fullName && (
            <span className="text-sm font-medium">{user.fullName}</span>
          )}
          {showEmail && (
            <span className="text-xs text-gray-500">{user.email}</span>
          )}
        </div>
      </div>
      {showRole && (
        <Badge variant="outline" className={roleColors[user.role]}>
          {UserRoleLabels[user.role]}
        </Badge>
      )}
    </div>
  );
};

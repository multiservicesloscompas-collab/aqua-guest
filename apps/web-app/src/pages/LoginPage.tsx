import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Droplet, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, isAuthenticated, isLoading: authLoading } = useAppStore();

  useEffect(() => {
    console.log('LoginPage - Auth state:', { isAuthenticated, authLoading });
    if (isAuthenticated && !authLoading) {
      console.log('LoginPage - Redirecting to /');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (error: unknown) {
      console.error('Error al iniciar sesión:', error);

      const errorMessage = error instanceof Error ? error.message : '';

      if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Credenciales inválidas');
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Email no confirmado');
      } else {
        toast.error('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // La redirección se maneja automáticamente
    } catch (error: unknown) {
      console.error('Error al iniciar sesión con Google:', error);
      toast.error('Error al iniciar sesión con Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-blue-500 to-blue-600 relative overflow-hidden flex flex-col">
      {/* Decorative wave background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 w-full h-1/2 md:h-2/3"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Header with logo - integrated with gradient background */}
      <div className="relative z-10 pt-8 pb-4 px-8 text-center">
        <div className="flex justify-center mb-2">
          <Droplet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide mb-3">AQUAGEST</h1>
        <p className="text-white/90 text-sm font-medium">Login</p>
      </div>

      {/* Form Content - positioned on white wave */}
      <div className="flex-1 relative z-10 flex flex-col justify-between px-6 pt-4 pb-6 overflow-hidden">
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email or Username Input */}
            <div>
              <Input
                id="email"
                type="text"
                placeholder="Email o Usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                autoComplete="username"
                className="h-12 bg-white border-0 rounded-full px-5 shadow-md focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-400 text-sm"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                autoComplete="current-password"
                className="h-12 bg-white border-0 rounded-full px-5 pr-12 shadow-md focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-gray-400 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-cyan-400 hover:bg-cyan-500 text-white rounded-full font-semibold shadow-lg shadow-cyan-400/30 transition-all hover:shadow-xl hover:shadow-cyan-400/40 mt-4"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </div>

        {/* Bottom section with divider and Google button */}
        <div className="w-full max-w-sm mx-auto mt-auto">
          {/* Divider - at the bottom */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <div className="flex justify-center pb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="flex items-center justify-center gap-3 w-full h-11 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Sign in with Google"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 font-medium text-sm">Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

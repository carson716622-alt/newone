import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { ProfileSetupWizard } from '@/components/ProfileSetupWizard';

export default function CandidateAuth() {
  const [, setLocation] = useLocation();
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(loginData.email, loginData.password, 'candidate');
      if (result.success) {
        toast.success('Login successful!');
        setLocation('/browse');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {};

    if (!registerData.name.trim()) errors.name = 'Name is required';
    if (!registerData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) errors.email = 'Invalid email format';
    if (!registerData.password) errors.password = 'Password is required';
    else if (registerData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (registerData.password !== registerData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRegister()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      const registerResult = await register(
        registerData.name,
        registerData.email,
        registerData.password,
        'candidate'
      );

      if (registerResult.success) {
        toast.success('Account created! Logging in...');
        const loginResult = await login(registerData.email, registerData.password, 'candidate');
        if (loginResult.success) {
          toast.success('Logged in successfully!');
          setShowProfileSetup(true);
        }
      } else {
        toast.error(registerResult.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showProfileSetup) {
    return <ProfileSetupWizard isOpen={showProfileSetup} onComplete={() => setLocation('/browse')} />;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">ApplytoBlue</h1>
        </div>

        <Card className="bg-card border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Candidate Portal</CardTitle>
            <CardDescription>Find and apply to law enforcement positions</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={isSubmitting || isLoading}
                      className="bg-background/50 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={isSubmitting || isLoading}
                      className="bg-background/50 border-white/10"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting || isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-background/50 border-white/10"
                    />
                    {registerErrors.name && <p className="text-sm text-red-500">{registerErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-background/50 border-white/10"
                    />
                    {registerErrors.email && <p className="text-sm text-red-500">{registerErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-background/50 border-white/10"
                    />
                    {registerErrors.password && <p className="text-sm text-red-500">{registerErrors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-background/50 border-white/10"
                    />
                    {registerErrors.confirmPassword && <p className="text-sm text-red-500">{registerErrors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

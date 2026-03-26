import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function AgencyLogin() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password, 'agency');
      if (result.success) {
        toast.success('Login successful!');
        setLocation('/dashboard');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
      <div className="container max-w-md mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-white">
              AGENCY <span className="text-primary">LOGIN</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Access your department's job posting dashboard</p>
        </div>

        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your agency portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hr@department.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-white/10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-white/10"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setLocation('/agency-register')}
                    className="text-primary hover:underline font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
              <div className="bg-background/50 p-3 rounded text-xs space-y-1">
                <p className="text-muted-foreground">
                  <span className="text-white font-medium">Email:</span> hr@villapark.gov
                </p>
                <p className="text-muted-foreground">
                  <span className="text-white font-medium">Password:</span> Demo@1234
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

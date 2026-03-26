import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function AgencyRegister() {
  const [, setLocation] = useLocation();
  const { register, isLoading } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    departmentName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    numberOfOfficers: '',
    adminName: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.departmentName.trim()) newErrors.departmentName = 'Department name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.website.trim()) newErrors.website = 'Website is required';
    if (!formData.numberOfOfficers) newErrors.numberOfOfficers = 'Number of officers is required';
    else if (isNaN(Number(formData.numberOfOfficers))) newErrors.numberOfOfficers = 'Must be a number';
    if (!formData.adminName.trim()) newErrors.adminName = 'Admin name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(
        formData.adminName,
        formData.email,
        formData.password,
        'agency',
        {
          departmentName: formData.departmentName,
          address: formData.address,
          phone: formData.phone,
          website: formData.website,
          numberOfOfficers: Number(formData.numberOfOfficers)
        }
      );

      if (result.success) {
        toast.success('Agency registered successfully! Redirecting to login...');
        setTimeout(() => setLocation('/agency-login'), 1500);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold text-white">
              AGENCY <span className="text-primary">REGISTRATION</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Register your department to start posting job openings</p>
        </div>

        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-white">Department Information</CardTitle>
            <CardDescription>Provide details about your law enforcement agency</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="departmentName" className="text-white">Department Name *</Label>
                  <Input
                    id="departmentName"
                    placeholder="e.g., Chicago Police Department"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.departmentName ? 'border-red-500' : ''}`}
                  />
                  {errors.departmentName && <p className="text-xs text-red-500">{errors.departmentName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State ZIP"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`bg-background/50 border-white/10 ${errors.phone ? 'border-red-500' : ''}`}
                    />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfOfficers" className="text-white">Number of Officers *</Label>
                    <Input
                      id="numberOfOfficers"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.numberOfOfficers}
                      onChange={(e) => setFormData({...formData, numberOfOfficers: e.target.value})}
                      className={`bg-background/50 border-white/10 ${errors.numberOfOfficers ? 'border-red-500' : ''}`}
                    />
                    {errors.numberOfOfficers && <p className="text-xs text-red-500">{errors.numberOfOfficers}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hr@department.gov"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">Website *</Label>
                  <Input
                    id="website"
                    placeholder="https://department.gov"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.website ? 'border-red-500' : ''}`}
                  />
                  {errors.website && <p className="text-xs text-red-500">{errors.website}</p>}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <h3 className="font-semibold text-white">Department Logo (Optional)</h3>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <img src={logoPreview} alt="Logo preview" className="h-24 w-24 mx-auto object-contain" />
                      <p className="text-sm text-muted-foreground">Logo will appear on all job postings</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLogoPreview(null)}
                        className="border-white/10"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm font-medium text-white">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <h3 className="font-semibold text-white">Admin Account</h3>
                <p className="text-sm text-muted-foreground">Create your admin account to manage job postings</p>

                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-white">Admin Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="John Smith"
                    value={formData.adminName}
                    onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.adminName ? 'border-red-500' : ''}`}
                  />
                  {errors.adminName && <p className="text-xs text-red-500">{errors.adminName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`bg-background/50 border-white/10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                  {isSubmitting ? 'Creating Account...' : 'Register Department'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setLocation('/agency-login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

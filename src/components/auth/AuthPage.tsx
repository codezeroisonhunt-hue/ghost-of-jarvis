
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('signin');
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next');
  const nextPath = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(nextPath);
    }
  }, [user, navigate, nextPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Sign In Failed', {
          description: error.message
        });
      } else {
        toast.success('Welcome back!', {
          description: 'Successfully signed in to JARVIS'
        });
        navigate(nextPath);
      }
    } catch (error: any) {
      toast.error('Authentication Error', {
        description: error.message || 'Failed to sign in'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (password !== confirmPassword) {
      toast.error('Password Mismatch', {
        description: 'Please ensure both passwords are identical.'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error('Sign Up Failed', {
          description: error.message
        });
      } else {
        toast.success('Account Created', {
          description: 'Welcome to JARVIS! Please check your email to verify your account.'
        });
      }
    } catch (error: any) {
      toast.error('Authentication Error', {
        description: error.message || 'Failed to create account'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2 glow">JARVIS</h1>
          <p className="text-gray-400">Just A Rather Very Intelligent System</p>
        </div>
        
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-blue-400 text-center">Access Control</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Authenticate to access the JARVIS interface
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 mx-4 bg-gray-800/50">
              <TabsTrigger value="signin" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-blue-400">Email</Label>
                    <Input 
                      id="signin-email"
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-blue-400">Password</Label>
                    <Input 
                      id="signin-password"
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-blue-400">Email</Label>
                    <Input 
                      id="signup-email"
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-blue-400">Password</Label>
                    <Input 
                      id="signup-password"
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-blue-400">Confirm Password</Label>
                    <Input 
                      id="confirm-password"
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;

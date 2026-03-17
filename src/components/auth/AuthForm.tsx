import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignIn = async (e: React.FormEvent) => {
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
        navigate('/interface');
      }
    } catch (error: any) {
      toast.error('Authentication Error', {
        description: error.message || 'Failed to sign in'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      if (!otpSent) {
        // Send OTP for sign in
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
        });

        if (error) {
          toast.error('Failed to send OTP', {
            description: error.message
          });
        } else {
          setOtpSent(true);
          toast.success('OTP Sent', {
            description: 'Please check your phone for the verification code.'
          });
        }
      } else {
        // Verify OTP for sign in
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms'
        } as any);

        if (error) {
          toast.error('Verification Failed', {
            description: error.message
          });
        } else {
          toast.success('Welcome!', {
            description: 'You have successfully signed in with phone.'
          });
          navigate('/interface');
        }
      }
    } catch (error: any) {
      toast.error('Authentication Error', {
        description: error.message || 'Failed to authenticate'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
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
      const redirectUrl = `${window.location.origin}/interface`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        toast.error('Sign Up Failed', {
          description: error.message
        });
      } else {
        setPendingVerification(true);
        toast.success('Account Created!', {
          description: 'Please check your email to verify your account.'
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

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      if (!otpSent) {
        // Send OTP for sign up
        const { error } = await supabase.auth.signUp({
          phone: phone,
          password: password
        });

        if (error) {
          toast.error('Failed to send OTP', {
            description: error.message
          });
        } else {
          setOtpSent(true);
          toast.success('OTP Sent', {
            description: 'Please check your phone for the verification code.'
          });
        }
      } else {
        // Verify OTP for sign up
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'signup'
        } as any);

        if (error) {
          toast.error('Verification Failed', {
            description: error.message
          });
        } else {
          toast.success('Account Created!', {
            description: 'Your phone number has been verified successfully.'
          });
          navigate('/interface');
        }
      }
    } catch (error: any) {
      toast.error('Authentication Error', {
        description: error.message || 'Failed to create account'
      });
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400 text-center">Check Your Email</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            We've sent you a verification link. Please check your email and click the link to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setPendingVerification(false)}
            variant="outline"
            className="w-full bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant={authMethod === 'email' ? 'default' : 'outline'}
                onClick={() => {
                  setAuthMethod('email');
                  setOtpSent(false);
                  setOtp('');
                  setPhone('');
                }}
                className={authMethod === 'email' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                }
              >
                Email
              </Button>
              <Button
                type="button"
                variant={authMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => {
                  setAuthMethod('phone');
                  setOtpSent(false);
                  setOtp('');
                  setEmail('');
                  setPassword('');
                }}
                className={authMethod === 'phone' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                }
              >
                Phone
              </Button>
            </div>

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
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
              </form>
            ) : (
              <form onSubmit={handlePhoneSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone" className="text-blue-400">Phone Number</Label>
                  <Input 
                    id="signin-phone"
                    type="tel" 
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={otpSent}
                    className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500 disabled:opacity-50"
                  />
                </div>
                
                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="signin-otp" className="text-blue-400">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        className="gap-2"
                      >
                        <InputOTPGroup className="gap-2">
                          <InputOTPSlot 
                            index={0} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={1} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={2} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={3} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={4} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={5} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={loading}
                >
                  {loading ? (otpSent ? 'Verifying...' : 'Sending OTP...') : (otpSent ? 'Verify Code' : 'Send OTP')}
                </Button>

                {otpSent && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="w-full bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  >
                    Use Different Phone Number
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="signup">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant={authMethod === 'email' ? 'default' : 'outline'}
                onClick={() => {
                  setAuthMethod('email');
                  setOtpSent(false);
                  setOtp('');
                  setPhone('');
                }}
                className={authMethod === 'email' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                }
              >
                Email
              </Button>
              <Button
                type="button"
                variant={authMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => {
                  setAuthMethod('phone');
                  setOtpSent(false);
                  setOtp('');
                  setEmail('');
                }}
                className={authMethod === 'phone' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                }
              >
                Phone
              </Button>
            </div>

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailSignUp} className="space-y-4">
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
              </form>
            ) : (
              <form onSubmit={handlePhoneSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-blue-400">Phone Number</Label>
                  <Input 
                    id="signup-phone"
                    type="tel" 
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={otpSent}
                    className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500 disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-phone-password" className="text-blue-400">Password</Label>
                  <Input 
                    id="signup-phone-password"
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={otpSent}
                    className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-500 disabled:opacity-50"
                  />
                </div>
                
                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-otp" className="text-blue-400">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        className="gap-2"
                      >
                        <InputOTPGroup className="gap-2">
                          <InputOTPSlot 
                            index={0} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={1} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={2} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={3} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={4} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                          <InputOTPSlot 
                            index={5} 
                            className="w-12 h-12 bg-gray-900/50 border-blue-500/30 text-white text-lg"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={loading}
                >
                  {loading ? (otpSent ? 'Verifying...' : 'Creating Account...') : (otpSent ? 'Verify & Create Account' : 'Create Account')}
                </Button>

                {otpSent && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="w-full bg-gray-800/50 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  >
                    Use Different Phone Number
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
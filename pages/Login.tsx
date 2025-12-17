import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { User as UserIcon } from 'lucide-react';
import { loginUser, googleAuthenticate } from '../services/mockData';
import { useGoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const processUser = (user: any) => {
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Smart Redirect based on Role
      if (user.role === 'admin') {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin');
      } else {
        localStorage.removeItem('isAdmin');
        navigate('/profile');
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      processUser(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const user = await googleAuthenticate(tokenResponse.access_token);
        processUser(user);
      } catch (err: any) {
        setError("Google Login failed: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Login Failed"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4285F4]/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D96570]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <Card className="max-w-sm w-full p-10 relative z-10 bg-[#1E1F20]/90 backdrop-blur-xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center border bg-[#A8C7FA]/20 border-[#A8C7FA]/30 transition-colors duration-300">
             <UserIcon className="w-8 h-8 text-[#A8C7FA]" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-[#E3E3E3] mb-2">
            Welcome Back
        </h2>
        <p className="text-center text-[#8E918F] mb-8 text-sm">
            Login to your account
        </p>

        <div className="mb-6">
            <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 hover:bg-gray-100 font-medium py-3 px-4 rounded-full transition-all duration-200"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google
            </button>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#444746]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1E1F20] text-[#8E918F]">Or continue with email</span>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
                type="email"
                label="Email Address"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div className="text-sm text-[#CF6679] text-center bg-[#CF6679]/10 py-2 rounded-lg">{error}</div>}
          
          <Button type="submit" className="w-full" isLoading={loading} variant="primary">
            Login
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#444746] flex flex-col gap-4 text-center text-sm">
            <div className="text-[#C4C7C5]">
                Don't have an account? <Link to="/register" className="text-[#A8C7FA] hover:underline font-medium">Register here</Link>
            </div>
        </div>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { UserPlus } from 'lucide-react';
import { registerUser, googleAuthenticate } from '../services/mockData';
import { useGoogleLogin } from '@react-oauth/google';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const role = 'user';
      // We pass the entered code to the backend. 
      // The backend compares it against the secure environment variable.
      const user = await registerUser(name, email, password, role);
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      if (user.role === 'admin') {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const user = await googleAuthenticate(tokenResponse.access_token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (user.role === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            localStorage.removeItem('isAdmin');
            navigate('/profile');
        }
      } catch (err: any) {
        setError("Google Sign-up failed: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Sign-up Failed"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#9B72CB]/10 blur-[100px] rounded-full pointer-events-none"></div>

      <Card className="max-w-md w-full p-10 relative z-10 bg-[#1E1F20]/90 backdrop-blur-xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#6DD58C]/20 rounded-full flex items-center justify-center border border-[#6DD58C]/30">
            <UserPlus className="w-8 h-8 text-[#6DD58C]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-[#E3E3E3] mb-8">Create Account</h2>

        <div className="mb-6">
            <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 hover:bg-gray-100 font-medium py-3 px-4 rounded-full transition-all duration-200"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Sign up with Google
            </button>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#444746]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1E1F20] text-[#8E918F]">Or register with email</span>
            </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email Address"
            placeholder="john@example.com"
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
          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          
          {error && <div className="text-sm text-[#CF6679] text-center bg-[#CF6679]/10 py-2 rounded-lg">{error}</div>}
          
          <Button type="submit" className="w-full" isLoading={loading}>
            Create Account
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-[#C4C7C5]">
            Already have an account? <Link to="/login" className="text-[#A8C7FA] hover:underline">Login here</Link>
        </div>
      </Card>
    </div>
  );
};
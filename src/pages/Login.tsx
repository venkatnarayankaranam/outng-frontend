import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole, getDashboardPath } from "@/utils/security";
import axiosInstance from "@/utils/axiosInstance";

// Admin credentials mapping for fallback
const ADMIN_CREDENTIALS = {
  "floorincharge@kietgroup.com": {
    password: "FloorIncharge@2026",
    role: "floor-incharge"
  },
  "hostelincharge@kietgroup.com": {
    password: "HostelIncharge@2026",
    role: "hostel-incharge"
  },
  "maingate@kietgroup.com": {
    password: "MainGate@2026",
    role: "gate"
  },
  "warden@kietgroup.com": {
    password: "Warden@2026",
    role: "warden"
  }
};

// Backend URL - Remove render URL and replace with localhost
const backendUrl = "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login, isAuthenticated, userRole, userDetails } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('[Login] Auth check:', {
      isAuthenticated,
      userRole,
      currentPath,
      hasToken: !!localStorage.getItem('token'),
      userDetails // Log userDetails to verify it's available
    });

    // Only redirect if on login page and authenticated
    if (isAuthenticated && userRole && currentPath === '/login') {
      const dashboardPath = `/dashboard/${userRole.replace('security', 'gate')}`; // Handle security/gate role mapping
      console.log('[Login] Redirecting to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, userRole, userDetails]); // Add userDetails to dependencies

  const authenticateWithBackend = async (email: string, password: string) => {
    try {
      setConnectionError(false);
      const response = await axiosInstance.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        return {
          success: true,
          userData: response.data.user,
          token: response.data.token
        };
      }
      return { success: false, message: response.data.message || 'Authentication failed' };
    } catch (error: any) {
      if (error.message === 'Network Error') {
        setConnectionError(true);
        return { success: false, message: 'Backend connection failed', fallback: true };
      }
      return { success: false, message: error.response?.data?.message || 'Authentication failed' };
    }
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendAuth = await authenticateWithBackend(email, password);
      
      if (backendAuth.success && backendAuth.userData) {
        if (backendAuth.token) {
          localStorage.setItem('token', backendAuth.token);
        }
        
        const normalizedRole = normalizeRole(backendAuth.userData.role);
        await login(email, normalizedRole, backendAuth.userData);
        toast.success(`Welcome back, ${backendAuth.userData.name || email}`);
        
        const dashboardPath = getDashboardPath(normalizedRole);
        console.log('[Login] Navigating to:', dashboardPath);
        navigate(dashboardPath, { replace: true });
        return;
      }
      
      // Fallback authentication for admin users
      if (backendAuth.fallback || connectionError) {
        if (email in ADMIN_CREDENTIALS) {
          const adminInfo = ADMIN_CREDENTIALS[email as keyof typeof ADMIN_CREDENTIALS];
          
          if (password === adminInfo.password) {
            const mockToken = btoa(`admin:${email}`);
            localStorage.setItem('token', mockToken);
            const normalizedRole = normalizeRole(adminInfo.role);
            await login(email, normalizedRole);
            toast.success(`Welcome, ${normalizedRole.replace('-', ' ')}`);
            navigate(getDashboardPath(normalizedRole), { replace: true });
            return;
          }
        }
      }
      
      toast.error(backendAuth.message || "Invalid login credentials");
    } catch (error) {
      console.error('[Login] Error:', error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700 text-white' : 'glass-card'} w-full max-w-md p-8 space-y-6 overflow-y-auto max-h-screen`}>
        <div className="flex justify-end">
          <button
            onClick={toggleTheme}
            className="hover:opacity-80 transition-opacity"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Outing System</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            Sign in to access your dashboard
          </p>
          {connectionError && (
            <p className="text-yellow-500 text-sm mt-2">
              Backend connection failed. Using fallback authentication.
            </p>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className={`pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              className={`w-full ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>


          </form>
      </Card>
    </div>
  );
};

export default Login;
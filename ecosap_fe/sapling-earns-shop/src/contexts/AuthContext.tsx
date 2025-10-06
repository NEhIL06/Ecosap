import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = "http://localhost:3000/api/v1";


interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  aadhar_number: string;
  signature: string;
  ecocredits: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  aadhar_number: string;
  signature: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      const newToken = response.data.token;
      console.log(newToken);
      localStorage.setItem("token", newToken);

      setToken(newToken);
      console.log("fetching user with token:", newToken);
      await fetchUser(newToken);
      console.log("user fetched:", user);
      toast({
        title: "Welcome back! 🌱",
        description: "Successfully logged in",
      });
      console.log("navigating to /");
      return;
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      await axios.post(`${API_BASE_URL}/SignUp`, userData);
      toast({
        title: "Account Created! 🎉",
        description: "Please log in to continue",
      });
    } catch (error) {
      const message = error.response?.data?.error || "Signup failed";
      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast({
      title: "Logged out",
      description: "Come back soon! 🌿",
    });
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!token) return;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/update`,
        { updates },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(response.data.user);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!token) return;
    try {
      await axios.post(
        `${API_BASE_URL}/user/delete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      logout();
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently removed",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        updateUser,
        deleteAccount,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

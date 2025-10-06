import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, User, Upload, Store, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="gradient-primary bg-clip-text text-transparent">EcoSAP</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/upload"
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/upload") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link
            to="/store"
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/store") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Store className="h-4 w-4" />
            Store
          </Link>
          <Link
            to="/profile"
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

          <div className="flex items-center gap-3 border-l pl-6">
            <div className="flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-primary-foreground shadow-eco">
              <Leaf className="h-4 w-4" />
              <span className="font-bold">{user?.ecocredits || 0}</span>
              <span className="text-xs opacity-90">credits</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

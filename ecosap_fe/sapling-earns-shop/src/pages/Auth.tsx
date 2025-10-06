import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, MapPin, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/");
    }
  }, [ navigate]);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
    aadhar_number: "",
    signature: "",
  });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 150;

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSignupData({
          ...signupData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        toast({
          title: "Location captured! 📍",
          description: "Coordinates have been filled in",
        });
        setIsGettingLocation(false);
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message || "Failed to get location",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      }
    );
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignupData({ ...signupData, signature: "" });
  };

  const getSignatureBase64 = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSignature) {
      toast({
        title: "Signature required",
        description: "Please sign in the canvas before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const signatureBase64 = getSignatureBase64();
      await signup({
        ...signupData,
        signature: signatureBase64,
        coordinates: {
          latitude: parseFloat(signupData.latitude),
          longitude: parseFloat(signupData.longitude),
        },
      });
      setSignupData({
        username: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        latitude: "",
        longitude: "",
        aadhar_number: "",
        signature: "",
      });
      clearSignature();
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-eco">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to EcoSAP</CardTitle>
          <CardDescription>Earn credits by planting saplings 🌱</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" variant="eco" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    minLength={6}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone</Label>
                  <Input
                    id="signup-phone"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    required
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">Address</Label>
                  <Input
                    id="signup-address"
                    value={signupData.address}
                    onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Coordinates</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getLocation}
                      disabled={isGettingLocation}
                    >
                      <MapPin className="mr-2 h-3 w-3" />
                      {isGettingLocation ? "Getting..." : "Use My Location"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-lat">Latitude</Label>
                      <Input
                        id="signup-lat"
                        type="number"
                        step="any"
                        value={signupData.latitude}
                        onChange={(e) => setSignupData({ ...signupData, latitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lng">Longitude</Label>
                      <Input
                        id="signup-lng"
                        type="number"
                        step="any"
                        value={signupData.longitude}
                        onChange={(e) => setSignupData({ ...signupData, longitude: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-aadhar">Aadhaar Number</Label>
                  <Input
                    id="signup-aadhar"
                    value={signupData.aadhar_number}
                    onChange={(e) => setSignupData({ ...signupData, aadhar_number: e.target.value })}
                    required
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      <Pencil className="inline h-3 w-3 mr-1" />
                      Signature
                    </Label>
                    {hasSignature && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSignature}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="border-2 border-input rounded-lg bg-white">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full cursor-crosshair touch-none"
                      style={{ height: "150px" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sign above with your mouse or touch screen
                  </p>
                </div>
                <Button type="submit" variant="eco" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

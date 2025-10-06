import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Leaf, MapPin, Phone, Mail, CreditCard, User } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.username}! 👋</h1>
          <p className="text-muted-foreground">Here's your environmental impact summary</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="gradient-card shadow-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Eco Credits
              </CardTitle>
              <CardDescription>Your current balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{user.ecocredits}</div>
              <p className="text-sm text-muted-foreground mt-2">Keep planting to earn more! 🌱</p>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Info
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Aadhaar: {user.aadhar_number}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-eco">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
              <CardDescription>Your registered address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{user.address}</p>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Lat: {user.coordinates.latitude.toFixed(4)}
                </Badge>
                <Badge variant="secondary">
                  Lng: {user.coordinates.longitude.toFixed(4)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 gradient-card shadow-eco">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>How to earn and spend eco-credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Upload Sapling Images</h3>
                <p className="text-sm text-muted-foreground">
                  Visit the Upload page and submit photos of your planted saplings to earn credits
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Earn Credits</h3>
                <p className="text-sm text-muted-foreground">
                  Credits are calculated based on the area covered by your saplings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shop in the EcoStore</h3>
                <p className="text-sm text-muted-foreground">
                  Use your credits to purchase farming supplies and equipment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

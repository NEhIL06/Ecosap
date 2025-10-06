import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Upload as UploadIcon, Leaf, Check } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const { token, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [gsd, setGsd] = useState("0.45");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !token) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("gsd", gsd);

      const response = await axios.post(
        "http://localhost:3000/api/v1/sapling/credits",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(response.data);
      await refreshUser();
      
      toast({
        title: "Credits Earned! 🎉",
        description: `You earned ${response.data.creditsAdded} credits!`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.error || "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Sapling Image 🌱</h1>
          <p className="text-muted-foreground">Earn eco-credits by sharing your planting efforts</p>
        </div>

        <Card className="gradient-card shadow-eco">
          <CardHeader>
            <CardTitle>Submit Your Sapling</CardTitle>
            <CardDescription>Upload an image to calculate area and earn credits</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Sapling Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                {preview && (
                  <div className="mt-4 rounded-lg overflow-hidden border-2 border-primary/20">
                    <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsd">Ground Sample Distance (GSD)</Label>
                <Input
                  id="gsd"
                  type="number"
                  step="0.01"
                  value={gsd}
                  onChange={(e) => setGsd(e.target.value)}
                  placeholder="0.45"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Resolution metric for area calculation (default: 0.45)
                </p>
              </div>

              <Button type="submit" variant="eco" className="w-full" disabled={isLoading || !selectedFile}>
                <UploadIcon className="mr-2 h-4 w-4" />
                {isLoading ? "Processing..." : "Calculate Credits"}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-6 rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Success!</h3>
                </div>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span>Calculated Area:</span>
                    <span className="font-bold">{result.area.toFixed(2)} m²</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Credits Earned:</span>
                    <span className="font-bold">+{result.creditsAdded}</span>
                  </p>
                  <div className="border-t border-primary-foreground/20 pt-2 mt-2">
                    <p className="flex justify-between text-lg">
                      <span>Total Credits:</span>
                      <span className="font-bold flex items-center gap-1">
                        <Leaf className="h-5 w-5" />
                        {result.totalCredits}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;

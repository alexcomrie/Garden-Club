import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Store, Github } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const appVersion = '1.0.0';

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-green-600 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/garden-list')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About Garden Club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center flex-col space-y-4">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center">
                <Store className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">Garden Club</h2>
                <p className="text-gray-600">Version {appVersion}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Garden Club is your one-stop platform for discovering and ordering from local plant nurseries.
              </p>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://github.com/yourusername/garden-club', '_blank')}
                >
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
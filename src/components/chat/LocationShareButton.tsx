import { useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LocationShareButtonProps {
  isConnected: boolean;
  onSend: (text: string) => void;
}

const LocationShareButton = ({ isConnected, onSend }: LocationShareButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const shareLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported", variant: "destructive" });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const lat = latitude.toFixed(4);
        const lng = longitude.toFixed(4);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        onSend(`📍 Shared location: ${lat}, ${lng}\n${mapsUrl}`);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        toast({
          title: "Location access denied",
          description: err.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onSend, toast]);

  if (!isConnected) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={shareLocation}
      disabled={loading}
      className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0"
      title="Share location"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
    </Button>
  );
};

export default LocationShareButton;

import { useState, useEffect } from "react";
import { Star, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SponsorRequestButtonProps {
  listingId: string;
  listingTitle: string;
}

interface SponsorRequest {
  id: string;
  status: string;
  duration_days: number;
  requested_at: string;
  admin_notes: string | null;
}

export function SponsorRequestButton({ listingId, listingTitle }: SponsorRequestButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<SponsorRequest | null>(null);
  const [duration, setDuration] = useState("7");

  useEffect(() => {
    if (user && listingId) {
      fetchExistingRequest();
    }
  }, [user, listingId]);

  const fetchExistingRequest = async () => {
    const { data } = await supabase
      .from("sponsor_requests")
      .select("*")
      .eq("listing_id", listingId)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setExistingRequest(data);
  };

  const handleSubmitRequest = async () => {
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase.from("sponsor_requests").insert({
      listing_id: listingId,
      user_id: user.id,
      duration_days: parseInt(duration),
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request submitted!",
        description: "Your sponsorship request is pending admin approval.",
      });
      setIsOpen(false);
      fetchExistingRequest();
    }
    setIsLoading(false);
  };

  // Show status badge if there's an existing request
  if (existingRequest) {
    const statusConfig = {
      pending: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "Pending" },
      approved: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Approved" },
      rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Rejected" },
    };

    const config = statusConfig[existingRequest.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        Sponsor: {config.label}
      </Badge>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Star className="h-4 w-4" />
          Promote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Sponsorship</DialogTitle>
          <DialogDescription>
            Request to promote "{listingTitle}" for increased visibility. Admin approval required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Sponsorship Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Benefits of Sponsorship:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Highlighted placement in search results</li>
              <li>• Featured badge on your listing</li>
              <li>• Priority display on homepage</li>
              <li>• Increased visibility to buyers</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

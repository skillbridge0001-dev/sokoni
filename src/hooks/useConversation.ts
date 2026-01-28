import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useConversation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const startConversation = async (listingId: string, sellerId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message sellers",
        variant: "destructive",
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "This is your own listing",
      });
      return;
    }

    setIsCreating(true);

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      navigate(`/messages?c=${existing.id}`);
      setIsCreating(false);
      return;
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    navigate(`/messages?c=${newConvo.id}`);
    setIsCreating(false);
  };

  return {
    startConversation,
    isCreating,
  };
}

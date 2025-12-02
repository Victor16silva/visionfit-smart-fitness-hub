
-- Update user_goals table with additional fields
ALTER TABLE public.user_goals 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS height_cm integer,
ADD COLUMN IF NOT EXISTS photo_front_url text,
ADD COLUMN IF NOT EXISTS photo_back_url text,
ADD COLUMN IF NOT EXISTS photo_left_url text,
ADD COLUMN IF NOT EXISTS photo_right_url text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trainer_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trainer_request_date timestamp with time zone;

-- Create trainer_chat_requests table for trainer notifications
CREATE TABLE IF NOT EXISTS public.trainer_chat_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, completed
  trainer_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Create trainer_messages table for chat
CREATE TABLE IF NOT EXISTS public.trainer_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.trainer_chat_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trainer_chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainer_chat_requests
CREATE POLICY "Users can create own requests" 
ON public.trainer_chat_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests" 
ON public.trainer_chat_requests 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Trainers can update requests" 
ON public.trainer_chat_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- RLS policies for trainer_messages
CREATE POLICY "Users can send messages in own requests" 
ON public.trainer_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trainer_chat_requests 
    WHERE id = request_id 
    AND (user_id = auth.uid() OR trainer_id = auth.uid() OR has_role(auth.uid(), 'personal'::app_role))
  )
);

CREATE POLICY "Users can view messages in own requests" 
ON public.trainer_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_chat_requests 
    WHERE id = request_id 
    AND (user_id = auth.uid() OR trainer_id = auth.uid() OR has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user photos
CREATE POLICY "Users can upload own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can update own photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for trainer_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.trainer_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trainer_chat_requests;

-- Trigger for updated_at
CREATE TRIGGER update_trainer_chat_requests_updated_at
BEFORE UPDATE ON public.trainer_chat_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

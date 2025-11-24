-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (creator_id != opponent_id)
);

-- Create challenge messages table
CREATE TABLE public.challenge_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Users can view own challenges"
ON public.challenges
FOR SELECT
USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own challenges"
ON public.challenges
FOR UPDATE
USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- RLS Policies for challenge messages
CREATE POLICY "Users can view challenge messages"
ON public.challenge_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.challenges
    WHERE challenges.id = challenge_messages.challenge_id
    AND (challenges.creator_id = auth.uid() OR challenges.opponent_id = auth.uid())
  )
);

CREATE POLICY "Users can create challenge messages"
ON public.challenge_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.challenges
    WHERE challenges.id = challenge_messages.challenge_id
    AND (challenges.creator_id = auth.uid() OR challenges.opponent_id = auth.uid())
    AND challenges.status = 'accepted'
  )
);

-- Trigger for challenges updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Run this SQL in your Supabase SQL Editor to create the conversations table
-- Go to: Supabase Dashboard > SQL Editor > New Query

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New Chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster ordering
CREATE INDEX idx_conversations_updated_at ON conversations (updated_at DESC);

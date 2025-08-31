-- Create credentials table for storing account credentials
-- Run this in Supabase SQL Editor

-- Enable Row Level Security (RLS)
CREATE TABLE IF NOT EXISTS credentials (
    account_name TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credentials_email ON credentials(email);

-- Enable Row Level Security
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to manage their own credentials
CREATE POLICY "Users can manage their own credentials" ON credentials
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_credentials_updated_at 
    BEFORE UPDATE ON credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- INSERT INTO credentials (account_name, email, password, pin) 
-- VALUES ('groww_main', 'your-email@example.com', 'your-password', '12345')
-- ON CONFLICT (account_name) DO NOTHING;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CredentialsFormData } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for server-side operations
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// GET /api/credentials - Get all credentials
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not configured. Please check environment variables.' },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

// POST /api/credentials - Create new credentials
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not configured. Please check environment variables.' },
      { status: 500 }
    );
  }

  try {
    const body: CredentialsFormData = await request.json();
    
    // Validate required fields
    if (!body.account_name || !body.email || !body.password || !body.pin) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if account name already exists
    const { data: existing } = await supabase
      .from('credentials')
      .select('account_name')
      .eq('account_name', body.account_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this name already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('credentials')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating credentials:', error);
      return NextResponse.json(
        { error: 'Failed to create credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create credentials:', error);
    return NextResponse.json(
      { error: 'Failed to create credentials' },
      { status: 500 }
    );
  }
}

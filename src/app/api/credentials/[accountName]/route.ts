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

// GET /api/credentials/[accountName] - Get credentials by account name
export async function GET(
  request: NextRequest,
  { params }: { params: { accountName: string } }
) {
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
      .eq('account_name', params.accountName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Credentials not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

// PUT /api/credentials/[accountName] - Update credentials
export async function PUT(
  request: NextRequest,
  { params }: { params: { accountName: string } }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not configured. Please check environment variables.' },
      { status: 500 }
    );
  }

  try {
    const body: Partial<CredentialsFormData> = await request.json();
    
    // Validate that at least one field is provided
    if (!body.account_name && !body.email && !body.password && !body.pin) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('credentials')
      .update(body)
      .eq('account_name', params.accountName)
      .select()
      .single();

    if (error) {
      console.error('Error updating credentials:', error);
      return NextResponse.json(
        { error: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update credentials:', error);
    return NextResponse.json(
      { error: 'Failed to update credentials' },
      { status: 500 }
    );
  }
}

// DELETE /api/credentials/[accountName] - Delete credentials
export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountName: string } }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not configured. Please check environment variables.' },
      { status: 500 }
    );
  }

  try {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('account_name', params.accountName);

    if (error) {
      console.error('Error deleting credentials:', error);
      return NextResponse.json(
        { error: 'Failed to delete credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Credentials deleted successfully' });
  } catch (error) {
    console.error('Failed to delete credentials:', error);
    return NextResponse.json(
      { error: 'Failed to delete credentials' },
      { status: 500 }
    );
  }
}

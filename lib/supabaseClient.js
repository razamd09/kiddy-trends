import { createClient } from '@supabase/supabase-js'

// Browser-safe client using the public anon key — unlike supabaseAdmin, this
// is fine to import into 'use client' components. Used for uploading a
// video's bytes directly to Storage via a signed upload URL (see
// /api/admin/upload-video/sign), which needs to run in the browser to avoid
// routing large files through a Vercel serverless function's 4.5MB body cap.
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

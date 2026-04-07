import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SERVER: Supabase environment variables are missing.')
  }

  // Use require here to prevent the 'next/headers' import from being evaluated
  // during the client-side bundling of server actions that import this utility.
  // This is a known workaround for Next.js build errors in hybrid client/server modules.
  const { cookies } = require('next/headers')
  const cookieStore = cookies()

  return createServerComponentClient({
    cookies: () => cookieStore
  }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  } as any)
}

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const createServerSupabaseClient = () => {
  // Use require here to prevent the 'next/headers' import from being evaluated
  // during the client-side bundling of server actions that import this utility.
  // This is a known workaround for Next.js build errors in hybrid client/server modules.
  const { cookies } = require('next/headers')
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

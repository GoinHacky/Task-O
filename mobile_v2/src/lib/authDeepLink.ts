import { supabase } from '@/src/lib/supabase'

/** Parse Supabase auth redirect URLs (#access_token / ?access_token). */
export function parseSupabaseAuthTokens(url: string): {
  access_token: string
  refresh_token: string
  type: string | null
} | null {
  try {
    const hashIdx = url.indexOf('#')
    const queryIdx = url.indexOf('?')
    let params: URLSearchParams
    if (hashIdx !== -1) {
      params = new URLSearchParams(url.slice(hashIdx + 1))
    } else if (queryIdx !== -1) {
      params = new URLSearchParams(url.slice(queryIdx + 1))
    } else {
      return null
    }
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return null
    return {
      access_token,
      refresh_token,
      type: params.get('type'),
    }
  } catch {
    return null
  }
}

export type AuthDeepLinkResult = { ok: boolean; isRecovery: boolean }

export async function applyAuthDeepLink(url: string): Promise<AuthDeepLinkResult> {
  const parsed = parseSupabaseAuthTokens(url)
  if (!parsed) return { ok: false, isRecovery: false }
  const isRecovery = parsed.type === 'recovery'
  const { error } = await supabase.auth.setSession({
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
  })
  return { ok: !error, isRecovery }
}

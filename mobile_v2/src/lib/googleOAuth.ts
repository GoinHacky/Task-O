import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import { applyAuthDeepLink } from '@/src/lib/authDeepLink'
import { supabase } from '@/src/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const redirectTo = Linking.createURL('auth/callback')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error) return { ok: false, error: error.message }
    if (!data?.url) return { ok: false, error: 'Missing OAuth URL.' }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type !== 'success' || !result.url) return { ok: false, error: 'Sign-in cancelled.' }

    const applied = await applyAuthDeepLink(result.url)
    if (!applied.ok) return { ok: false, error: 'Could not complete sign-in.' }

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Google sign-in failed.' }
  }
}


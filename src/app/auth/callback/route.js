import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || 'canviar-contrasenya'
  const origin = url.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/#${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/#login`)
}

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function traduzErro(message: string): string {
  if (message.toLowerCase().includes('already been registered') || message.toLowerCase().includes('already registered')) {
    return 'Já existe uma conta com esse e-mail.'
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'Muitos convites em pouco tempo — aguarde alguns minutos e tente de novo.'
  }
  return message
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não suportado.' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Sessão ausente.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Sessão inválida — entre novamente.' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: profile, error: profileError } = await adminClient
    .from('pricing3d_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    return json({ error: 'Não foi possível verificar suas permissões.' }, 500)
  }
  if (profile?.role !== 'admin') {
    return json({ error: 'Apenas administradores podem convidar usuários.' }, 403)
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const redirectTo = typeof body?.redirectTo === 'string' ? body.redirectTo : undefined

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Informe um e-mail válido.' }, 400)
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo,
  })

  if (inviteError) {
    return json({ error: traduzErro(inviteError.message) }, 400)
  }

  return json({ success: true, userId: inviteData.user?.id })
})

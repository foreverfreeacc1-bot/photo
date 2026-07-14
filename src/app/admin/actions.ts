'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/auth'
import type { Section } from '@/lib/types'

type ActionResult = { ok: boolean; error?: string }

async function assertCanEdit(section: Section): Promise<ActionResult | null> {
  const session = await getAdminSession()
  if (!session) return { ok: false, error: 'Не авторизован' }
  if (!session.access[section].can_edit)
    return { ok: false, error: 'Нет прав на редактирование раздела' }
  return null
}

// ---------------------------------------------------------------- CONTENT
export async function saveContent(
  updates: { key: string; locale: 'ru' | 'en'; value: string; section: string }[],
): Promise<ActionResult> {
  const denied = await assertCanEdit('content')
  if (denied) return denied
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rows = updates.map((u) => ({
    section: u.section,
    key: u.key,
    locale: u.locale,
    value: u.value,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  }))

  const { error } = await supabase
    .from('site_content')
    .upsert(rows, { onConflict: 'key,locale' })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/content')
  return { ok: true }
}

// ---------------------------------------------------------------- PHOTOS
const photoMetaSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Укажите название'),
  category: z.enum(['work', 'art']),
  technique: z.string().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  alt: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  published: z.coerce.boolean().default(true),
})

// Create a photo record after the file was uploaded from the browser.
export async function createPhoto(input: {
  title: string
  category: 'work' | 'art'
  technique?: string | null
  year?: number | null
  alt?: string | null
  storage_path: string
  sort_order?: number
  published?: boolean
}): Promise<ActionResult> {
  const denied = await assertCanEdit('photos')
  if (denied) return denied
  const parsed = photoMetaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('photos').insert({
    ...parsed.data,
    storage_path: input.storage_path,
    created_by: user?.id ?? null,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/photos')
  return { ok: true }
}

export async function updatePhoto(
  id: string,
  patch: Partial<{
    title: string
    category: 'work' | 'art'
    technique: string | null
    year: number | null
    alt: string | null
    sort_order: number
    published: boolean
  }>,
): Promise<ActionResult> {
  const denied = await assertCanEdit('photos')
  if (denied) return denied
  const supabase = createClient()
  const { error } = await supabase.from('photos').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/admin/photos')
  return { ok: true }
}

export async function deletePhoto(
  id: string,
  storage_path: string,
): Promise<ActionResult> {
  const denied = await assertCanEdit('photos')
  if (denied) return denied
  const supabase = createClient()
  const bucket = process.env.NEXT_PUBLIC_PHOTOS_BUCKET || 'photos'
  await supabase.storage.from(bucket).remove([storage_path])
  const { error } = await supabase.from('photos').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/admin/photos')
  return { ok: true }
}

// ---------------------------------------------------------------- USERS
// Invite a new admin by email (service role). They set a password via the
// invite link Supabase emails them.
export async function inviteAdmin(input: {
  email: string
  full_name: string
  role_id: string | null
}): Promise<ActionResult> {
  const denied = await assertCanEdit('users')
  if (denied) return denied
  const email = input.email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: 'Некорректный email' }

  const admin = createAdminClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/login`
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: input.full_name },
    redirectTo,
  })
  if (error) return { ok: false, error: error.message }

  // The trigger created the profile; set role + name explicitly.
  if (data?.user?.id) {
    await admin
      .from('profiles')
      .update({ full_name: input.full_name, role_id: input.role_id })
      .eq('id', data.user.id)
  }
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function updateAdmin(
  id: string,
  patch: { role_id?: string | null; is_active?: boolean; full_name?: string },
): Promise<ActionResult> {
  const denied = await assertCanEdit('users')
  if (denied) return denied
  const session = await getAdminSession()
  // Guard: never let a non-owner lock themselves or the owner out.
  if (id === session?.profile.id && patch.is_active === false)
    return { ok: false, error: 'Нельзя деактивировать самого себя' }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

// ---------------------------------------------------------------- ROLES
export async function saveRole(input: {
  id?: string
  name: string
  access: { section: Section; can_view: boolean; can_edit: boolean }[]
}): Promise<ActionResult> {
  const denied = await assertCanEdit('roles')
  if (denied) return denied
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Укажите название роли' }
  const supabase = createClient()

  let roleId = input.id
  if (roleId) {
    const { error } = await supabase.from('roles').update({ name }).eq('id', roleId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { data, error } = await supabase
      .from('roles')
      .insert({ name })
      .select('id')
      .single()
    if (error) return { ok: false, error: error.message }
    roleId = data.id
  }

  const rows = input.access.map((a) => ({
    role_id: roleId!,
    section: a.section,
    can_view: a.can_view || a.can_edit,
    can_edit: a.can_edit,
  }))
  const { error: aErr } = await supabase
    .from('role_section_access')
    .upsert(rows, { onConflict: 'role_id,section' })
  if (aErr) return { ok: false, error: aErr.message }

  revalidatePath('/admin/roles')
  return { ok: true }
}

export async function deleteRole(id: string): Promise<ActionResult> {
  const denied = await assertCanEdit('roles')
  if (denied) return denied
  const supabase = createClient()
  const { data: role } = await supabase
    .from('roles')
    .select('is_system')
    .eq('id', id)
    .single()
  if (role?.is_system)
    return { ok: false, error: 'Системную роль нельзя удалить' }
  const { error } = await supabase.from('roles').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/roles')
  return { ok: true }
}

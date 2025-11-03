'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function LegacyEditorRedirect() {
  const params = useParams<{ id: string; lang: string }>()
  const router = useRouter()

  useEffect(() => {
    if (params?.lang && params?.id) {
      router.replace(`/${params.lang}/pages/landing/${params.id}`)
    }
  }, [params?.lang, params?.id, router])

  return null
}



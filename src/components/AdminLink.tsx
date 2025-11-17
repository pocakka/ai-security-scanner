'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function AdminLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem('admin_auth')
    setIsLoggedIn(authToken === 'authenticated')
  }, [])

  if (!isLoggedIn) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href="/admin"
        className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
      >
        Admin Panel
      </Link>
    </div>
  )
}

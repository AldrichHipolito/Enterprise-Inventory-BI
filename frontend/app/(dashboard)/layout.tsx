// app/(dashboard)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppSidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {

    const user = getCurrentUser()
    const isExpired = user ? user.exp * 1000 < Date.now() : true

    if (!user || isExpired) {
      router.push("/login")
      return
    }

    setChecked(true)
  }, [router])

  if (!checked) {
    return null
  }

  return (
    <SidebarProvider >
      <AppSidebar />
      <main className="flex-1">
        <Topbar breadcrumb="Overview" />
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
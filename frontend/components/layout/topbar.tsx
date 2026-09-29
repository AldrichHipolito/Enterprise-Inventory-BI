// components/layout/topbar.tsx
//
// Matches eibi-ui-mockup.html's topbar layout (breadcrumb left, role info +
// avatar right) with one deliberate change: the mockup's "Preview as" <select>
// lets a viewer instantly switch which role's dashboard they see — that's a
// stakeholder-demo affordance, not something safe to ship for real. Here it's
// a static label showing the user's actual role(s) instead of a functional
// impersonation control. If a genuine "Admin previews another role's view"
// feature is wanted later, it should be a separate, explicitly permissioned
// feature, not a plain client-side dropdown.

"use client"
import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getCurrentUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getInitials(fullName: string | null): string {
  if (!fullName) return "?"
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}



interface TopbarProps {
  /** e.g. "Overview" — the current page's breadcrumb trail after "Dashboard". */
  breadcrumb?: string
}

export function Topbar({ breadcrumb = "Overview" }: TopbarProps) {
  const user = getCurrentUser()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const fullName = typeof window !== "undefined" ? localStorage.getItem("userFullName") : null

async function handleLogout() {
  setIsLoggingOut(true)
  const refreshToken = localStorage.getItem("refreshToken")
  
  if (refreshToken) {
    try { await logout(refreshToken) } catch { /* proceed anyway */ }
  }
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userFullName")
  router.push("/login")
}

  return (
    <div className="flex h-[60px] flex-none items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div className="text-[13px] text-slate-500">
          Dashboard <span className="mx-1">›</span>
          <b className="font-semibold text-slate-900">{breadcrumb}</b>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[12px] text-slate-500">
          {user?.roles?.join(", ") ?? "Unknown role"}
        </div>
        <div className="flex size-8 items-center justify-center rounded-full bg-[#0B2545] text-[12px] font-bold text-white">
          

          <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            {getInitials(fullName)}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem>
                  {/* <Button onClick={handleLogout} disabled={isLoggingOut} variant="ghost" size="sm">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button> */}
                  <Button onClick={handleLogout} disabled={isLoggingOut} variant="ghost" size="sm">
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </Button>
                </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>
    </div>
  )
}
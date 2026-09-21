// components/layout/app-sidebar.tsx
//
// Nav order, icon choices, and role→item visibility are pulled directly from
// eibi-ui-mockup.html's ROLES/NAV_META/NAV_ORDER config (the project's own
// reference implementation), not invented here. Role names below match your
// backend's seeded role names exactly ("Purchasing Officer", "Warehouse Staff",
// "Inventory Manager") — the mockup's short internal keys (Purchasing,
// Warehouse, InventoryMgr) are just its own variable names, not the real role
// strings your JWT actually carries.
//
// Per the mockup's design rule (see its `render()` function comment): a role
// that cannot access a module at all does not see a greyed-out entry for it —
// the item is omitted from the sidebar entirely. Read-only access still shows
// the item (marked "(view)"), since the mockup treats "hidden" and "read-only"
// as different states — enforcement of what read-only actually restricts
// happens on the page/action level, not here.

"use client"

import {
  LayoutDashboard,
  Package,
  Users,
  Warehouse,
  ClipboardList,
  Bookmark,
  Settings,
  Search,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"

type NavKey = "dashboard" | "products" | "suppliers" | "warehouses" | "po" | "stock" | "settings" | "audit"

// NAV_META, order-preserving — matches eibi-ui-mockup.html's NAV_ORDER exactly.
const NAV_ITEMS: { key: NavKey; label: string; href: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", href: "/products", icon: Package },
  { key: "suppliers", label: "Suppliers", href: "/suppliers", icon: Users },
  { key: "warehouses", label: "Warehouses", href: "/warehouses", icon: Warehouse },
  { key: "po", label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
  { key: "stock", label: "Stock", href: "/stock", icon: Bookmark },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
  { key: "audit", label: "Audit Logs", href: "/audit-logs", icon: Search },
]

// Mirrors eibi-ui-mockup.html's ROLES config exactly (":r" suffix = read-only,
// item still shows but visually marked). Keyed by the REAL role name strings
// from your seeded database (18-security-design.md / seed.ts), not the
// mockup's internal shorthand keys.
const ROLE_NAV: Record<string, string[]> = {
  Administrator: ["dashboard", "products", "suppliers", "warehouses", "po", "stock", "settings", "audit"],
  Executive: ["dashboard", "products:r", "suppliers:r", "warehouses:r", "po:r", "stock:r"],
  "Purchasing Officer": ["dashboard", "products:r", "suppliers", "po"],
  "Warehouse Staff": ["dashboard", "products:r", "warehouses:r", "po:r", "stock"],
  "Inventory Manager": ["dashboard", "products", "suppliers:r", "warehouses", "po:r", "stock"],
  Auditor: ["products:r", "suppliers:r", "warehouses:r", "po:r", "stock:r", "audit"],
}

function getVisibleNavKeys(roles: string[]): Map<NavKey, boolean> {
  const visible = new Map<NavKey, boolean>()

  for (const roleName of roles) {
    const entries = ROLE_NAV[roleName] ?? []
    for (const entry of entries) {
      const [key, suffix] = entry.split(":") as [NavKey, string | undefined]
      const isReadOnly = suffix === "r"
      // If any role grants full access, prefer that over another role's
      // read-only grant for the same item (relevant once a user can hold
      // more than one role).
      const alreadyFull = visible.get(key) === false
      if (!alreadyFull) {
        visible.set(key, isReadOnly)
      }
    }
  }

  return visible
}

export function AppSidebar() {
  const pathname = usePathname()
  const user = getCurrentUser()
  const visibleNav = getVisibleNavKeys(user?.roles ?? [])

  return (
    <Sidebar className="border-none bg-[#0b2545] text-[#cdd7e8]">
      <SidebarHeader className="gap-3 px-2 pt-2">
        <div className="flex items-center gap-2.5 px-1 pb-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#0B2545] text-[#FF6B35]">
            <Warehouse className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">EIBI</div>
            <div className="text-[11px] uppercase tracking-wide text-[#8CA0BF]">
              Inventory Platform
            </div>
          </div>
        </div>

        {/* Stock health pulse bar — placeholder values until a real
            /dashboards endpoint exists to source this from. */}
        <div className="flex h-1.5 overflow-hidden rounded-full">
          <span className="h-full bg-emerald-500" style={{ width: "64%" }} />
          <span className="h-full bg-amber-500" style={{ width: "22%" }} />
          <span className="h-full bg-red-500" style={{ width: "14%" }} />
        </div>
        <div className="-mt-2 flex justify-between px-1 text-[10.5px] text-[#8CA0BF]">
          <span>Stock health</span>
          <span>64% healthy</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10.5px] uppercase tracking-wide text-[#6C82A6]">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => visibleNav.has(item.key)).map((item) => {
                const isReadOnly = visibleNav.get(item.key)
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="text-[#B9C6DC] data-[active=true]:bg-[#FF6B35] data-[active=true]:text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      <Icon className="size-4" />
                      <span>
                        {item.label}
                        {isReadOnly && (
                          <span className="ml-1 font-normal opacity-60">(view)</span>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.08] pt-3.5">
        <div className="flex items-center gap-1.5 px-2 text-[11px] text-[#8CA0BF]">
          <Warehouse className="size-3.5" />
          <span>
            {user?.warehouseIds?.length ? "Assigned warehouse(s)" : "All warehouses"}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
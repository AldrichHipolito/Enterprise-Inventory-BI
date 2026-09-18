"use client"

import { getCurrentUser } from "@/lib/auth"

export default function DashboardPage() {
  const user = getCurrentUser()
 

  if (!user) {
    // no token at all — shouldn't normally happen once route protection
    // exists, but a safe fallback for now
    return <div>Please log in.</div>
  }

  const canSeeExecutive = user.roles.includes("Administrator") || user.roles.includes("Executive")
  const canSeeInventory = user.roles.includes("Administrator") || user.roles.includes("Inventory Manager")
  const canSeeWarehouse = user.roles.includes("Administrator") || user.roles.includes("Inventory Manager") || user.roles.includes("Warehouse Staff")
  const canSeePurchasing = user.roles.includes("Administrator") || user.roles.includes("Purchasing Officer")

  // then use these booleans to decide which tabs/dashboards render

  return <div><p>Dashboard content goes here</p></div>
}
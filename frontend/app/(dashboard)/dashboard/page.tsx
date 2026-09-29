"use client"

import { getCurrentUser } from "@/lib/auth"
import { KpiCard } from "@/components/charts/kpi-card"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

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

  const chartData = [
    { month: "January", desktop: 186 },
    { month: "February", desktop: 305 },
    { month: "March", desktop: 237 },
    { month: "April", desktop: 73 },
    { month: "May", desktop: 209 },
    { month: "June", desktop: 214 },
  ]

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig



  return (
    
    <div className="p-6 bg-[var(--canvas)] min-h-full">

      <h1 className="text-[20px] font-bold mb-0.5">Executive Overview</h1>
      <p className="text-[13px] text-[var(--ink-soft)] mb-5">
        Business health across all warehouses — Phase 1 shows purchase spend; revenue arrives with Phase 2 sales data.
      </p>

        <div className="grid gap-3.5 mb-[22px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <KpiCard label="Total Purchase Spend" value="₱1,284,600" trend={{ value: "+8.2% vs last month", direction: "up" }} />
          <KpiCard label="Inventory Value" value="₱6,910,200" trend={{ value: "+2.1% vs last month", direction: "up" }} />
          <KpiCard label="Active Users (24h)" value="18" />
          <KpiCard label="Orders Today" value="7" />
        </div>

        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[10px] p-[18px]">
               <Card>
                <CardHeader>
                  <CardTitle>Bar Chart</CardTitle>
                  <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing total visitors for the last 6 months
                  </div>
                </CardFooter>
              </Card>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[10px] p-[18px]">
            {/* warehouse status panel */}
          </div>
        </div>
    </div>
    
  )
}
// components/charts/kpi-card.tsx
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  label: string
  value: string
  trend?: {
    value: string
    direction: "up" | "down"
  }
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold text-slate-900">
          {value}
        </div>
        {trend && (
          <div
            className={
              trend.direction === "up"
                ? "mt-1 text-[13px] text-emerald-600"
                : "mt-1 text-[13px] text-red-600"
            }
          >
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
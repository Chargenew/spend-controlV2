"use client"

import { Wallet, Calendar, Calculator } from "lucide-react"

interface RealitySectionProps {
  remainingAmount: number
  remainingDays: number
  baseRapd: number
}

export function RealitySection({ remainingAmount, remainingDays, baseRapd }: RealitySectionProps) {
  const items = [
    {
      icon: Wallet,
      label: "Remaining",
      value: `₹${Math.round(remainingAmount).toLocaleString("en-IN")}`,
    },
    {
      icon: Calendar,
      label: "Days Left",
      value: remainingDays.toString(),
    },
    {
      icon: Calculator,
      label: "Base RAPD",
      value: `₹${Math.round(baseRapd).toLocaleString("en-IN")}`,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl p-3 bg-card border border-border text-center"
        >
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-lg bg-secondary">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground mb-0.5">
            {item.value}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}

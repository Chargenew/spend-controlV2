"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectionCardProps {
  projectedSavings: number
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  useEffect(() => {
    if (value === prevValue) return

    const duration = 600
    const startTime = Date.now()
    const startValue = displayValue
    let animationFrame: number

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (value - startValue) * easeOutCubic
      
      setDisplayValue(current)
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setPrevValue(value)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [value, prevValue, displayValue])

  return (
    <span>
      {prefix}{Math.round(displayValue).toLocaleString("en-IN")}
    </span>
  )
}

export function ProjectionCard({ projectedSavings }: ProjectionCardProps) {
  const isPositive = projectedSavings >= 0

  return (
    <div className="rounded-2xl p-5 bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isPositive ? "bg-success/20" : "bg-danger/20"
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <Sparkles className="w-4 h-4 text-danger" />
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Projected Savings
          </span>
        </div>
      </div>

      <div className={cn(
        "text-3xl font-bold tracking-tight mb-1",
        isPositive ? "text-success" : "text-danger"
      )}>
        <AnimatedNumber value={projectedSavings} prefix="₹" />
      </div>

      <p className="text-xs text-muted-foreground">
        If current trend continues
      </p>
    </div>
  )
}

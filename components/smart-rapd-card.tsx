"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Flame, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartRapdCardProps {
  smartRapd: number
  percentageChange: number
  isImproving: boolean
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  useEffect(() => {
    // Skip animation if value hasn't changed
    if (value === prevValue) return

    const duration = 600
    const startTime = Date.now()
    const startValue = displayValue
    let animationFrame: number

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function - ease out cubic
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
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, prevValue, displayValue])

  return (
    <span>
      {prefix}{Math.round(displayValue).toLocaleString("en-IN")}
    </span>
  )
}

export function SmartRapdCard({ smartRapd, percentageChange, isImproving }: SmartRapdCardProps) {
  const absChange = Math.abs(percentageChange)

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
        "bg-card border border-border",
        isImproving 
          ? "scale-[1.02] shadow-[0_0_40px_rgba(34,197,94,0.15)]" 
          : "scale-[0.98] shadow-[0_0_40px_rgba(239,68,68,0.15)]"
      )}
    >
      {/* Gradient overlay based on status */}
      <div
        className={cn(
          "absolute inset-0 opacity-10 transition-opacity duration-500",
          isImproving
            ? "bg-gradient-to-br from-success/50 to-transparent"
            : "bg-gradient-to-br from-danger/50 to-transparent"
        )}
      />

      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Smart RAPD
        </p>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className={cn(
            "text-5xl font-bold tracking-tight transition-colors duration-300",
            isImproving ? "text-success" : "text-danger"
          )}>
            <AnimatedNumber value={smartRapd} prefix="₹" />
          </span>
          <span className="text-lg text-muted-foreground">/day</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Safe to Spend Today
        </p>

        {/* Percentage change indicator */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
            isImproving
              ? "bg-success/20 text-success"
              : "bg-danger/20 text-danger"
          )}
        >
          {isImproving ? (
            <>
              <TrendingUp className="w-4 h-4" />
              <span>+{absChange.toFixed(1)}% improvement</span>
              <Flame className="w-4 h-4" />
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4" />
              <span>{absChange.toFixed(1)}% decline</span>
              <AlertTriangle className="w-4 h-4" />
            </>
          )}
        </div>
      </div>

      {/* Animated pulse effect */}
      <div
        className={cn(
          "absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-all duration-1000",
          isImproving ? "bg-success/20" : "bg-danger/20"
        )}
      />
    </div>
  )
}

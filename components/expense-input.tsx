"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpenseInputProps {
  onAddExpense: (amount: number) => void
  todayExpenses: number
}

export function ExpenseInput({ onAddExpense, todayExpenses }: ExpenseInputProps) {
  const [value, setValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const amount = parseFloat(value)
    if (isNaN(amount) || amount <= 0) return

    setIsAdding(true)
    onAddExpense(amount)
    setValue("")
    
    // Visual feedback
    setTimeout(() => setIsAdding(false), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  // Focus input on mount (mobile friendly)
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus()
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
      <div className="max-w-md mx-auto">
        {/* Today's expenses summary */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">{"Today's Expenses"}</span>
          <span className="text-sm font-medium text-foreground">
            ₹{Math.round(todayExpenses).toLocaleString("en-IN")}
          </span>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <IndianRupee className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              placeholder="Enter expense"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full h-14 pl-12 pr-4 rounded-2xl",
                "bg-input border border-border",
                "text-lg font-medium text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>
          
          <button
            type="submit"
            disabled={!value || parseFloat(value) <= 0}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "active:scale-95",
              isAdding && "scale-90 bg-success"
            )}
          >
            <Plus className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  )
}

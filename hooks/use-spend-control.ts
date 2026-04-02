"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

// Configuration constants from TDD
const TREND_WINDOW_DAYS = 3
const TREND_EXPONENT_K = 1.2
const DEFAULT_BUDGET = 30000
const STORAGE_KEY = "spend-control-data"
const DATE_OVERRIDE_KEY = "spend-control-date-override"

// Date override for testing - allows simulating different days
function getOverrideDate(): Date | null {
  if (typeof window === "undefined") return null
  try {
    const override = localStorage.getItem(DATE_OVERRIDE_KEY)
    if (override) {
      const parsed = JSON.parse(override)
      if (parsed.enabled && parsed.date) {
        return new Date(parsed.date)
      }
    }
  } catch {
    // Ignore errors
  }
  return null
}

function getCurrentDate(): Date {
  return getOverrideDate() || new Date()
}

export interface DailyEntry {
  id: string
  date: string
  expense: number
  smartRapd: number
  baseRapd: number
  timestamp: number
}

export interface MonthSummary {
  id: string // "2026-04"
  totalBudget: number
  totalSpent: number
  totalDays: number
  finalSavings: number | null
  avgRapd: number | null
}

export interface SpendControlData {
  currentMonth: MonthSummary
  dailyEntries: DailyEntry[]
  dailySmartRapdHistory: Record<string, number> // date -> smartRapd for that day
  lastEntryDate: string | null // Track the last entry date for day change detection
  previousSmartRapd: number | null // Track previous Smart RAPD for change feedback
}

// Utility functions using getCurrentDate() for testability
function getMonthId(): string {
  const now = getCurrentDate()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function getDaysInMonth(): number {
  const now = getCurrentDate()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function getDayOfMonth(): number {
  return getCurrentDate().getDate()
}

function getRemainingDays(): number {
  return getDaysInMonth() - getDayOfMonth() + 1
}

function getTodayString(): string {
  const now = getCurrentDate()
  return now.toISOString().split("T")[0]
}

function getDateNDaysAgo(n: number): string {
  const date = getCurrentDate()
  date.setDate(date.getDate() - n)
  return date.toISOString().split("T")[0]
}

function getDefaultData(): SpendControlData {
  return {
    currentMonth: {
      id: getMonthId(),
      totalBudget: DEFAULT_BUDGET,
      totalSpent: 0,
      totalDays: getDaysInMonth(),
      finalSavings: null,
      avgRapd: null,
    },
    dailyEntries: [],
    dailySmartRapdHistory: {},
    lastEntryDate: null,
    previousSmartRapd: null,
  }
}

export function useSpendControl() {
  const [data, setData] = useState<SpendControlData>(getDefaultData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [dateOverride, setDateOverrideState] = useState<{ enabled: boolean; date: string } | null>(null)

  // Set date override for testing
  const setDateOverride = useCallback((date: string | null) => {
    if (date) {
      const override = { enabled: true, date }
      localStorage.setItem(DATE_OVERRIDE_KEY, JSON.stringify(override))
      setDateOverrideState(override)
    } else {
      localStorage.removeItem(DATE_OVERRIDE_KEY)
      setDateOverrideState(null)
    }
    // Force reload data with new date context
    window.location.reload()
  }, [])

  // Load date override on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DATE_OVERRIDE_KEY)
      if (stored) {
        setDateOverrideState(JSON.parse(stored))
      }
    } catch {
      // Ignore errors
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: SpendControlData = JSON.parse(stored)
        // Reset if new month
        if (parsed.currentMonth.id !== getMonthId()) {
          // Archive old month and start fresh
          setData(getDefaultData())
        } else {
          setData(parsed)
        }
      }
    } catch {
      console.error("Failed to load data from localStorage")
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        console.error("Failed to save data to localStorage")
      }
    }
  }, [data, isLoaded])

  // ==========================================
  // CALCULATION ENGINE (from TDD Section 3)
  // ==========================================

  // 3.1 Base RAPD = Remaining Amount / Remaining Days
  const remainingAmount = data.currentMonth.totalBudget - data.currentMonth.totalSpent
  const remainingDays = getRemainingDays()
  const baseRapd = remainingDays > 0 ? remainingAmount / remainingDays : 0

  // Daily budget for expected spend calculation
  const dailyBudget = data.currentMonth.totalBudget / getDaysInMonth()

  // 3.2 Trend Factor = Recent Spend / Expected Spend (based on TREND_WINDOW_DAYS)
  const trendFactor = useMemo(() => {
    const today = getTodayString()
    const windowStart = getDateNDaysAgo(TREND_WINDOW_DAYS - 1)
    
    // Get entries within the trend window
    const recentEntries = data.dailyEntries.filter(entry => 
      entry.date >= windowStart && entry.date <= today
    )
    
    // Calculate actual spend in window
    const recentSpend = recentEntries.reduce((sum, entry) => sum + entry.expense, 0)
    
    // Calculate expected spend for the same window
    const daysInWindow = Math.min(TREND_WINDOW_DAYS, getDayOfMonth())
    const expectedSpend = dailyBudget * daysInWindow
    
    // Avoid division by zero
    if (expectedSpend === 0) return 1
    
    // Trend = Recent Spend / Expected Spend
    // > 1 means overspending, < 1 means underspending
    return recentSpend / expectedSpend
  }, [data.dailyEntries, dailyBudget])

  // 3.3 Smart RAPD = Base RAPD × (1 / Trend^k)
  // When trend > 1 (overspending), Smart RAPD < Base RAPD (stricter)
  // When trend < 1 (underspending), Smart RAPD > Base RAPD (more generous)
  const smartRapd = useMemo(() => {
    if (trendFactor === 0) return baseRapd
    
    const adjustment = 1 / Math.pow(trendFactor, TREND_EXPONENT_K)
    // Clamp adjustment to reasonable bounds (0.5x to 2x)
    const clampedAdjustment = Math.max(0.5, Math.min(2, adjustment))
    
    return baseRapd * clampedAdjustment
  }, [baseRapd, trendFactor])

  // 3.4 Monthly Average Smart RAPD = Sum of Smart RAPD / Days elapsed
  const monthlyAverageSmartRapd = useMemo(() => {
    const values = Object.values(data.dailySmartRapdHistory)
    if (values.length === 0) return smartRapd
    
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }, [data.dailySmartRapdHistory, smartRapd])

  // 3.5 Daily % Change = (Today Smart RAPD - Monthly Avg) / Monthly Avg × 100
  const percentageChange = useMemo(() => {
    if (monthlyAverageSmartRapd === 0) return 0
    return ((smartRapd - monthlyAverageSmartRapd) / monthlyAverageSmartRapd) * 100
  }, [smartRapd, monthlyAverageSmartRapd])

  // Is improving (positive change = RAPD went up = doing better)
  const isImproving = percentageChange >= 0

  // RAPD change from previous value (for dopamine feedback)
  const rapdChange = data.previousSmartRapd !== null 
    ? smartRapd - data.previousSmartRapd 
    : 0

  // Feedback message based on percentage change
  const feedbackMessage = useMemo(() => {
    if (percentageChange > 5) return { text: "Strong improvement!", type: "fire" as const }
    if (percentageChange > 0) return { text: "You're improving", type: "check" as const }
    if (percentageChange > -5) return { text: "Slight decline", type: "warn" as const }
    return { text: "Spending rising fast", type: "alert" as const }
  }, [percentageChange])

  // Day change detection
  const isNewDay = useMemo(() => {
    if (!data.lastEntryDate) return false
    return data.lastEntryDate !== getTodayString()
  }, [data.lastEntryDate])

  // Calculate average daily spend
  const averageDailySpend = getDayOfMonth() > 0
    ? data.currentMonth.totalSpent / getDayOfMonth()
    : 0

  // 3.6 Projected Savings = Budget - (Avg Daily Spend × Total Days)
  const projectedSavings = data.currentMonth.totalBudget - (averageDailySpend * getDaysInMonth())

  // ==========================================
  // ACTIONS
  // ==========================================

  // Update today's Smart RAPD in history
  const updateTodaySmartRapd = useCallback((newSmartRapd: number) => {
    const today = getTodayString()
    setData(prev => ({
      ...prev,
      dailySmartRapdHistory: {
        ...prev.dailySmartRapdHistory,
        [today]: newSmartRapd,
      },
    }))
  }, [])

  // Update today's RAPD whenever it changes
  useEffect(() => {
    if (isLoaded && smartRapd > 0) {
      updateTodaySmartRapd(smartRapd)
    }
  }, [smartRapd, isLoaded, updateTodaySmartRapd])

  // Add expense
  const addExpense = useCallback((amount: number) => {
    if (amount <= 0) return

    const today = getTodayString()
    const entryId = `${today}-${Date.now()}`
    
    setData(prev => {
      // Calculate new values after this expense
      const newTotalSpent = prev.currentMonth.totalSpent + amount
      const newRemaining = prev.currentMonth.totalBudget - newTotalSpent
      const newBaseRapd = remainingDays > 0 ? newRemaining / remainingDays : 0
      
      const newEntry: DailyEntry = {
        id: entryId,
        date: today,
        expense: amount,
        smartRapd: smartRapd, // Current smart RAPD at time of entry
        baseRapd: newBaseRapd,
        timestamp: Date.now(),
      }

      return {
        ...prev,
        currentMonth: {
          ...prev.currentMonth,
          totalSpent: newTotalSpent,
        },
        dailyEntries: [...prev.dailyEntries, newEntry],
        lastEntryDate: today,
        previousSmartRapd: smartRapd, // Store current as previous before it changes
      }
    })
  }, [remainingDays, smartRapd])

  // Update budget
  const updateBudget = useCallback((newBudget: number) => {
    if (newBudget <= 0) return
    setData(prev => ({
      ...prev,
      currentMonth: {
        ...prev.currentMonth,
        totalBudget: newBudget,
      },
    }))
  }, [])

  // Reset data
  const resetData = useCallback(() => {
    setData(getDefaultData())
  }, [])

  // Get today's expenses
  const todayExpenses = useMemo(() => {
    const today = getTodayString()
    return data.dailyEntries
      .filter(entry => entry.date === today)
      .reduce((sum, entry) => sum + entry.expense, 0)
  }, [data.dailyEntries])

  // Get today's entries for display
  const todayEntries = useMemo(() => {
    const today = getTodayString()
    return data.dailyEntries.filter(entry => entry.date === today)
  }, [data.dailyEntries])

  return {
    // Data
    totalBudget: data.currentMonth.totalBudget,
    totalSpent: data.currentMonth.totalSpent,
    remainingAmount,
    remainingDays,
    daysInMonth: getDaysInMonth(),
    dayOfMonth: getDayOfMonth(),
    
    // RAPD values (TDD Section 3)
    baseRapd,
    smartRapd,
    trendFactor,
    monthlyAverageSmartRapd,
    percentageChange,
    isImproving,
    
    // Projections
    projectedSavings,
    averageDailySpend,
    dailyBudget,
    
    // Today
    todayExpenses,
    todayEntries,
    
    // All entries
    dailyEntries: data.dailyEntries,
    
    // Actions
    addExpense,
    updateBudget,
    resetData,
    
    // Loading state
    isLoaded,
    
    // Date override for testing
    dateOverride,
    setDateOverride,
    currentDate: getCurrentDate().toISOString().split("T")[0],
  }
}

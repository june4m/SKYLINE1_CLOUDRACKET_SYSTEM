"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  fieldName: string
  timeSlot: string
}

export function ReservationModal({ isOpen, onClose, fieldName, timeSlot }: ReservationModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null)

  const durations = [
    { label: "1 hour", value: "1h", price: 5 },
    { label: "1h 30m", value: "1h30m", price: 5 },
    { label: "2 hour", value: "2h", price: 5 },
    { label: "2h 30m", value: "2h30m", price: 5 },
    { label: "3 hour", value: "3h", price: 5 },
  ]

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-lg p-6 w-80 z-50 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-accent mb-1">{fieldName}</p>
            <p className="text-xs opacity-80">{timeSlot}</p>
          </div>
          <button onClick={onClose} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {durations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => setSelectedDuration(duration.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                selectedDuration === duration.value
                  ? "bg-accent/30 border-2 border-accent"
                  : "bg-primary-foreground/10 border-2 border-transparent hover:border-accent/50"
              }`}
            >
              <span className="text-sm">{duration.label}</span>
              <span className="text-sm font-semibold">${duration.price}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            alert(`Booked ${selectedDuration} for $5`)
            onClose()
          }}
          disabled={!selectedDuration}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reserve ${selectedDuration ? "5" : "0"}
        </button>
      </div>
    </>
  )
}

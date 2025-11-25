"use client"

import { Header } from "@/components/header"
import { MoreVertical } from "lucide-react"

export default function MyReservation() {
  const reservations = [
    {
      id: "01",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
    {
      id: "02",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
    {
      id: "03",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
    {
      id: "04",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
    {
      id: "05",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
    {
      id: "06",
      date: "Thursday, 20 June 2024",
      time: "12:00",
      terrain: "Large Field 1",
      price: "$5.00",
      dateOfEntry: "Thursday, 20 June 2024 12:00 - 13:00 (1hr)",
      status: "Reserved",
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-primary text-primary-foreground grid grid-cols-6 gap-4 px-6 py-3">
              <div className="text-xs font-semibold">#</div>
              <div className="text-xs font-semibold">DATE</div>
              <div className="text-xs font-semibold">TERRAIN</div>
              <div className="text-xs font-semibold">PRICE</div>
              <div className="text-xs font-semibold">DATE OF ENTRY</div>
              <div className="text-xs font-semibold">STATUS</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="text-sm text-gray-600">{reservation.id}</div>
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{reservation.date}</div>
                    <div className="text-xs text-gray-600">{reservation.time}</div>
                  </div>
                  <div className="text-sm text-gray-900">{reservation.terrain}</div>
                  <div className="text-sm font-medium text-gray-900">{reservation.price}</div>
                  <div className="text-sm text-gray-900">
                    <div className="text-xs">{reservation.dateOfEntry}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {reservation.status}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              10 <span className="mx-2">•</span> Entries per page
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">&lt;</button>
              <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded">1</button>
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">2</button>
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">3</button>
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">...</button>
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">90</button>
              <button className="px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors">&gt;</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

interface LocationCardProps {
  name: string
  address: string
  hours: string
  fields: number
  maps: string
  gayah: string
  rating: number
  image: string
}

export function LocationCard({ name, address, hours, fields, maps, gayah, rating, image }: LocationCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="h-40 bg-gray-200 overflow-hidden">
        <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-navy mb-1">{name}</h3>
        <p className="text-xs text-gray-600 mb-3">{address}</p>

        {/* Hours */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-pink font-semibold">●</span>
          <span className="text-gray-700">{hours}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-pink">📍</span>
            <div>
              <p className="text-gray-600">{fields} fields</p>
              <p className="text-gray-600">{maps}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-pink">👥</span>
            <div>
              <p className="text-gray-600">{gayah}</p>
              <p className="text-gray-600">⭐ {rating}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

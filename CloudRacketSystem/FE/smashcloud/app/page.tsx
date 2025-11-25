import { Header } from "@/components/header"
import { LocationCard } from "@/components/location-card"
import { FeatureCard } from "@/components/feature-card"

export default function Home() {
  const locations = [
    {
      name: "Gor Harmoni",
      address: "(Purwokerto Timur)",
      hours: "07:00 - 23:00",
      fields: 4,
      maps: "Maps",
      gayah: "Gayah",
      rating: 5,
      image: "/badminton-court-indoor-facility.jpg",
    },
    {
      name: "Gor Serbaguna",
      address: "(Gor Satria Purwokerto)",
      hours: "07:00 - 23:00",
      fields: 4,
      maps: "Maps",
      gayah: "Gayah",
      rating: 5,
      image: "/badminton-sports-complex.jpg",
    },
    {
      name: "Gor Arcamas",
      address: "(Purwokerto Timur)",
      hours: "07:00 - 23:00",
      fields: 4,
      maps: "Maps",
      gayah: "Aiq",
      rating: 5,
      image: "/badminton-court-facility.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section
        className="relative h-96 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-500 overflow-hidden"
        id="home"
      >
        <img
          src="/badminton-player-action-shot-professional.jpg"
          alt="Badminton player"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700/80 via-purple-600/70 to-pink-500/80"></div>

        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-md">
            <h1 className="text-4xl sm:text-5xl font-bold text-pink mb-4 leading-tight text-balance">
              Booking a Badminton Court Becomes Easier Using the Cloud Racket Badminton Website
            </h1>
            <p className="text-white mb-6 text-sm leading-relaxed">
              Book badminton courts easily via the website. This website provides various places to rent the best
              badminton courts in the Purwokerto area.
            </p>
            <button className="px-6 py-3 bg-navy text-white rounded font-semibold hover:bg-navy/90 transition-colors">
              Booking Now
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📱"
              title="Platform Online"
              description="Badminton court reservations can be made via the website or online"
            />
            <FeatureCard
              icon="🏆"
              title="Recommended Field"
              description="Makes it easy to find badminton courts in the Purwokerto area"
            />
            <FeatureCard
              icon="💳"
              title="Online Payment"
              description="Providing online payments for customer security and convenience"
            />
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16" id="booking">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink font-semibold">LOCATION</span>
              <span className="text-pink text-lg">▶</span>
              <span className="text-pink text-lg">▶</span>
              <span className="text-pink text-lg">▶</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-2 text-balance">CHOOSE YOUR PLAY LOCATION</h2>
            <a href="#" className="text-navy font-semibold text-sm hover:text-pink transition-colors">
              See More {">"}
            </a>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {locations.map((location) => (
              <LocationCard key={location.name} {...location} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50" id="about">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                  <span className="text-pink text-lg">◀</span>
                  <span className="text-pink text-lg">◀</span>
                  <span className="text-pink text-lg">◀</span>
                  <span className="text-pink font-semibold">ABOUT US</span>
                  <span className="text-pink text-lg">▶</span>
                  <span className="text-pink text-lg">▶</span>
                  <span className="text-pink text-lg">▶</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4 text-balance">
                  WELCOME TO WEBSITE CloudRacket BADMINTON
                </h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  The CloudRacket Badminton website is an online badminton court rental website to make it easier for users
                  when looking for badminton courts in the Purwokerto area.
                </p>
                <button className="px-6 py-3 bg-navy text-white rounded font-semibold hover:bg-navy/90 transition-colors">
                  Read More
                </button>
              </div>
            </div>
            <div className="flex-1">
              <img
                src="/badminton-player-website-interface-laptop.jpg"
                alt="Website preview"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16" id="gallery">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink text-lg">◀</span>
              <span className="text-pink font-semibold">GALLERY</span>
              <span className="text-pink text-lg">▶</span>
              <span className="text-pink text-lg">▶</span>
              <span className="text-pink text-lg">▶</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy text-balance">BADMINTON PLAYERS GALLERY</h2>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 lg:row-span-2">
              <img
                src="/badminton-players-playing-match.jpg"
                alt="Players playing"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
            <div>
              <img
                src="/badminton-player-portrait.jpg"
                alt="Player portrait"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
            <div>
              <img
                src="/badminton-player-action.jpg"
                alt="Player action"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
            <div>
              <img
                src="/badminton-team-photo.jpg"
                alt="Team photo"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
            <div>
              <img
                src="/badminton-court-indoor.jpg"
                alt="Court"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>
          </div>

          {/* See All Gallery Link */}
          <div className="text-center mt-8">
            <a href="#" className="text-navy font-semibold hover:text-pink transition-colors">
              See All Gallery {">"}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-pink"></div>
            <div className="w-6 h-6 rounded-full bg-white"></div>
            <span className="font-bold">Cloud Racket Badminton</span>
          </div>
          <p className="text-sm text-gray-300">© 2025 Cloud Racket Badminton. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

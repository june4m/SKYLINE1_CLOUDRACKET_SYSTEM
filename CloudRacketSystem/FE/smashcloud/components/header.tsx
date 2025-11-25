export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary"></div>
          <span className="font-bold text-primary text-lg">Cloud Racket</span>
        </div>

        <nav className="flex items-center gap-8">
          <a href="#home" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
            Home
          </a>
          <a href="#booking" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Booking
          </a>
          <a href="#about" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            About us
          </a>
          <a href="#gallery" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Gallery
          </a>
          <a href="#contact" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Contact
          </a>
        </nav>

        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          Sign In
        </button>
      </div>
    </header>
  )
}

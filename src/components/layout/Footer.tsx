export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Mechanical Engineering Portfolio</p>
        <p className="opacity-80">Built with passion for mechanics and clean design.</p>
      </div>
    </footer>
  );
}

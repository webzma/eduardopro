import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustStrip from "./components/TrustStrip";
import Benefits from "./components/Benefits";
import Products from "./components/Products";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

// El catálogo se lee en vivo desde Supabase, así que renderizamos por request.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Benefits />
        <Products />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

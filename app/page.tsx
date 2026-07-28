import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustStrip from "./components/TrustStrip";
import Benefits from "./components/Benefits";
import Products from "./components/Products";
import Testimonials from "./components/Testimonials";
import Location from "./components/Location";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

// El catálogo se lee en vivo desde Supabase, así que renderizamos por request.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    // overflow-x is clipped on html/body in globals.css, so nothing here needs
    // a wrapper that would trap position: sticky.
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Benefits />
        <Products />
        <Testimonials />
        <Location />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

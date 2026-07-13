import { Routes, Route } from "react-router-dom";
import { SessionProvider } from "./config/session";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Talk } from "./pages/Talk";
import { Dashboard } from "./pages/Dashboard";
import { How } from "./pages/How";

export default function App() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-bg grid-bg flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/talk" element={<Talk />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/how" element={<How />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </SessionProvider>
  );
}

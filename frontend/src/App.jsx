import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Setup from "./pages/Setup.jsx";
import Rate from "./pages/Rate.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import { isAdmin, fetchTastingByCode, fetchTastingById } from "./api.js";

// Minimaler Initial-State
const emptyTasting = {
  id: "",
  title: "Whisky Tasting",
  host: "",
  released: false,
  completed: false,
  joinCode: "",
  drams: [],
  ratings: {} // nur lokal für UI
};

export default function App() {
  const [tasting, setTasting] = useState(emptyTasting);
  const [participant, setParticipant] = useState(localStorage.getItem("wt_participant") || "");
  const [admin, setAdminState] = useState(isAdmin());
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(()=>localStorage.setItem("wt_participant", participant), [participant]);

  // Function to leave current tasting
  const handleLeaveTasting = () => {
    setTasting(emptyTasting);
    nav("/");
  };

  useEffect(()=>localStorage.setItem("wt_participant", participant), [participant]);

  // Tasting anhand ?c=CODE oder ?t=ID laden
  useEffect(() => {
    const qs = new URLSearchParams(loc.search);
    const code = qs.get("c");
    const id = qs.get("t");
    const loader = async () => {
      try {
        let data;
        if (code) data = await fetchTastingByCode(code);
        else if (id) data = await fetchTastingById(id);
        if (data) setTasting(t => ({ ...t, ...data })); // server truth
      } catch (e) {
        console.error(e);
        alert("Tasting nicht gefunden.");
      }
    };
    loader();
  }, [loc.search]);

  return (
    <>
      {tasting.id && (
        <Header released={tasting.released} admin={admin} tasting={tasting} onLeaveTasting={handleLeaveTasting}/>
      )}
      <main>
        <Routes>
          <Route path="/" element={
            <Home setTasting={setTasting}
                  participant={participant} setParticipant={setParticipant}
                  currentTasting={tasting}/>
          }/>
          <Route path="/setup" element={
            <Setup tasting={tasting} setTasting={setTasting}
                   goRate={()=>nav("/rate")}
                   admin={admin} setAdminState={setAdminState}/>
          }/>
          <Route path="/rate" element={
            <Rate tasting={tasting} setTasting={setTasting}
                  participant={participant} setParticipant={setParticipant}
                  admin={admin}/>
          }/>
          <Route path="/board" element={
            <Leaderboard tasting={tasting} admin={admin}/>
          }/>
        </Routes>
      </main>
      <Footer/>
    </>
  );
}

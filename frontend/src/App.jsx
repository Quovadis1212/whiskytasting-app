import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Setup from "./pages/Setup.jsx";
import Rate from "./pages/Rate.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import { load, save, isAdmin, setAdmin } from "./store.js";

export default function App() {
  const [tasting, setTasting] = useState(load());
  const [participant, setParticipant] = useState(localStorage.getItem("wt_participant") || "");
  const [admin, setAdminState] = useState(isAdmin(load().id));
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(()=>save(tasting), [tasting]);
  useEffect(()=>localStorage.setItem("wt_participant", participant), [participant]);

  // optional: URL ?t=<id>
  useEffect(()=>{
    const p = new URLSearchParams(loc.search);
    const tid = p.get("t");
    if (tid && tid !== tasting.id) {
      // hier könnte später ein Fetch erfolgen
    }
  }, [loc.search, tasting.id]);

  return (
    <>
      <Header released={tasting.released} admin={admin}/>
      <main>
        <Routes>
          <Route path="/" element={
            <Setup tasting={tasting} setTasting={setTasting}
                   goRate={()=>nav("/rate")} admin={admin} setAdminState={setAdminState}/>
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

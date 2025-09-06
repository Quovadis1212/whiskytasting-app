import { useEffect, useMemo, useState } from "react";
import { Container, Card, Button, Row, Col, Form, ButtonGroup, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { submitRatings } from "../api.js";

// Redirect to Home if no tasting is loaded
function useRedirectIfNoTasting(tasting) {
  const nav = useNavigate();
  useEffect(() => {
    if (!tasting?.id) {
      nav("/", { replace: true });
    }
  }, [tasting?.id, nav]);
}
const AROMAS = [
  "Fruchtig", "Vanille", "Karamell", "Honig", "Würzig", "Rauchig",
  "Torf", "Blumig", "Nussig", "Zitrus", "Obst",
  "Schokolade", "Kaffee", "Eiche", "Leder", "Tabak", "Minze"
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export default function Rate({ tasting, setTasting, participant, setParticipant }) {
  useRedirectIfNoTasting(tasting);
  const [saved, setSaved] = useState(false);

  const drams = useMemo(() => [...(tasting.drams || [])].sort((a,b)=>a.order - b.order), [tasting.drams]);
  const [idx, setIdx] = useState(0);
  const current = drams[idx];

  // lokale Ratings (nur für UI); Server ist Quelle der Wahrheit für Leaderboard

  // Lokale Ratings persistent und zuverlässig laden/speichern
  const LOCAL_RATINGS_KEY = `wt_ratings_${tasting.id}_${participant}`;
  const [local, setLocal] = useState(() => {
    // 1. Try localStorage (in case of reload)
    if (tasting.id && participant) {
      try {
        const raw = localStorage.getItem(LOCAL_RATINGS_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    // 2. Fallback to tasting.ratings
    return (tasting.ratings?.[participant]) || {};
  });

  // Keep local ratings in sync with tasting/participant changes
  useEffect(() => {
    if (tasting.id && participant) {
      // If tasting.ratings has changed for this participant, update local
      const tRatings = tasting.ratings?.[participant] || {};
      setLocal(prev => {
        // Only update if different (avoid overwriting unsaved local edits)
        if (JSON.stringify(prev) !== JSON.stringify(tRatings)) {
          return tRatings;
        }
        return prev;
      });
    } else {
      setLocal({});
    }
    // eslint-disable-next-line
  }, [tasting.id, tasting.ratings, participant]);

  // Persist local ratings to localStorage on change
  useEffect(() => {
    if (tasting.id && participant) {
      localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(local));
    }
  }, [local, tasting.id, participant]);

  const getR = (order) => local[order] || { points: 50, notes: "", aromas: [] };
  const setR = (order, patch) =>
    setLocal(r => ({ ...r, [order]: { ...getR(order), ...patch } }));

  const toggleAroma = (order, tag) => {
    const r = getR(order);
    const set = new Set(r.aromas || []);
    set.has(tag) ? set.delete(tag) : set.add(tag);
    setR(order, { aromas: [...set] });
  };

  const save = async () => {
    if (!participant.trim()) return;
    setTasting(t => ({ ...t, ratings: { ...t.ratings, [participant.trim()]: local }}));
    let ok = true;
    if (tasting.id) {
      try {
        await submitRatings(tasting.id, participant.trim(), local);
      } catch (e) {
        ok = false;
        console.error(e);
        alert("Senden an Server fehlgeschlagen, lokal gespeichert.");
      }
    }
    setSaved(ok);
    setTimeout(() => setSaved(false), 2000);
  };

  const prev = () => setIdx(i => clamp(i - 1, 0, drams.length - 1));
  const next = () => setIdx(i => clamp(i + 1, 0, drams.length - 1));

  let headline = "";
  let broughtBy = "";
  if (current) {
    if (tasting.released && current.name) {
      headline = current.name;
      if (current.broughtBy) {
        broughtBy = `mitgebracht von ${current.broughtBy}`;
      }
    } else {
      headline = `Dram ${current.order}`;
    }
  }

  return (
    <Container className="py-3 container-mobile">
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Form.Label>Dein Name</Form.Label>
          <Form.Control value={participant} onChange={(e)=>setParticipant(e.target.value)} placeholder="Vorname" />
        </Card.Body>
      </Card>

      {tasting.completed ? (
        <div className="alert alert-info text-center my-4">
          Das Tasting wurde finalisiert.<br />Bewertungen sind nicht mehr möglich.
        </div>
      ) : drams.length === 0 ? (
        <div className="alert alert-warning text-center my-4">
          Der Organisator muss erst noch die Drams erfassen.<br />Danach Seite neu laden.
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Button variant="outline-secondary" size="sm" onClick={prev} disabled={idx===0}>←</Button>
            <div className="text-center">
              <div className="fw-bold">{headline}</div>
              {broughtBy && (
                <div className="text-muted small">{broughtBy}</div>
              )}
              <div className="text-muted small">{idx+1} von {drams.length}</div>
            </div>
            <Button variant="outline-secondary" size="sm" onClick={next} disabled={idx===drams.length-1}>→</Button>
          </div>

          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">Bewertung</div>
                <div className="fs-4">{getR(current?.order)?.points ?? 50}</div>
              </div>
              <Form.Label className="small text-muted d-flex justify-content-between">
                <span>0</span><span>50</span><span>100</span>
              </Form.Label>
              <Form.Range min={0} max={100}
                value={getR(current?.order)?.points ?? 50}
                onChange={(e)=> current && setR(current.order, { points: parseInt(e.target.value,10) })}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <div className="fw-semibold mb-2">Aromen</div>
              <ButtonGroup className="flex-wrap">
                {AROMAS.map(a => {
                  const active = current ? (getR(current.order).aromas || []).includes(a) : false;
                  return (
                    <Button key={a} size="sm"
                      variant={active ? "warning" : "outline-warning"}
                      className="me-2 mb-2"
                      onClick={()=> current && toggleAroma(current.order, a)}
                    >
                      {a}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </Card.Body>
          </Card>

          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <div className="fw-semibold mb-2">Notizen</div>
              <Form.Control as="textarea" rows={4}
                placeholder="Deine Gedanken zu diesem Dram…"
                value={current ? getR(current.order).notes : ""}
                onChange={(e)=> current && setR(current.order, { notes: e.target.value })}
              />
            </Card.Body>
          </Card>

          <div className="position-fixed bottom-0 start-0 end-0 p-2 bar-gradient">
            <div className="mx-auto container-mobile d-flex flex-column align-items-center gap-2">
              <Button className="w-100 btn-cta" disabled={!participant.trim()} onClick={save}>
                🔒 Bewertung speichern
              </Button>
              {saved && <div className="text-success fw-semibold">Gespeichert!</div>}
            </div>
          </div>
          <div style={{ height: 80 }} />
        </>
      )}
    </Container>
  );
}

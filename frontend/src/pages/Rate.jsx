import { useEffect, useMemo, useState } from "react";
import { Container, Card, Button, Row, Col, Form, ButtonGroup, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { submitRatings } from "../api.js";

const AROMAS = [
  "Fruity","Vanilla","Caramel","Honey","Spicy","Smoky",
  "Peaty","Floral","Nutty","Citrus","Apple","Pear",
  "Chocolate","Coffee","Oak","Leather","Tobacco","Mint"
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export default function Rate({ tasting, setTasting, participant, setParticipant, admin }) {
  const nav = useNavigate();

  const drams = useMemo(() => [...(tasting.drams || [])].sort((a,b)=>a.order - b.order), [tasting.drams]);
  const [idx, setIdx] = useState(0);
  const current = drams[idx];

  // lokale Ratings (nur für UI); Server ist Quelle der Wahrheit für Leaderboard
  const [local, setLocal] = useState(tasting.ratings?.[participant] || {});
  useEffect(() => { setLocal(tasting.ratings?.[participant] || {}); }, [participant, tasting.ratings]);

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
    // lokal
    setTasting(t => ({ ...t, ratings: { ...t.ratings, [participant.trim()]: local }}));

    // an Server senden
    if (tasting.id) {
      try {
        await submitRatings(tasting.id, participant.trim(), local);
      } catch (e) {
        console.error(e);
        alert("Senden an Server fehlgeschlagen, lokal gespeichert.");
      }
    }
  };

  const prev = () => setIdx(i => clamp(i - 1, 0, drams.length - 1));
  const next = () => setIdx(i => clamp(i + 1, 0, drams.length - 1));

  const headline = current ? `Dram ${current.order}` : "";

  return (
    <Container className="py-3 container-mobile">
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Form.Label>Dein Name</Form.Label>
          <Form.Control value={participant} onChange={(e)=>setParticipant(e.target.value)} placeholder="Vorname" />
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <Button variant="outline-secondary" size="sm" onClick={prev} disabled={idx===0}>←</Button>
        <div className="text-center">
          <div className="fw-bold">{headline}</div>
          <small className="text-muted">{idx+1} von {drams.length}</small>
          {!tasting.released && (
            <div className="mt-1">
              <Badge bg={admin ? "info" : "secondary"}>{admin ? "Orga‑Preview" : "Blindmodus"}</Badge>
            </div>
          )}
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
        <div className="mx-auto container-mobile d-flex gap-2">
          <Button className="w-50 btn-cta" disabled={!participant.trim()} onClick={save}>
            🔒 Bewertung speichern
          </Button>
          <Button className="w-50 btn-cta-outline" onClick={()=>nav("/board")}>
            Zur Auflösung
          </Button>
        </div>
      </div>
      <div style={{ height: 80 }} />
    </Container>
  );
}

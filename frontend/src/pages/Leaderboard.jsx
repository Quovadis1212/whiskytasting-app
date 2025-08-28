import { useEffect, useState } from "react";
import { Card, Alert, Container, Spinner, Form, Badge } from "react-bootstrap";
import { fetchLeaderboard } from "../api.js";

export default function Leaderboard({ tasting, admin }) {
  const [rows, setRows] = useState([]);
  const [released, setReleased] = useState(tasting.released);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState('all');

  useEffect(() => {
    const load = async () => {
      if (!tasting.id) return;
      setLoading(true);
      try {
        const data = await fetchLeaderboard(tasting.id);
        setRows(data.rows || []);
        setReleased(!!data.released);
        // Teilnehmer extrahieren
        if (data.participants) {
          setParticipants(data.participants);
        } else if (data.rows) {
          // Fallback: Teilnehmer aus rows sammeln
          const all = new Set();
          data.rows.forEach(r => {
            if (r.participants) Object.keys(r.participants).forEach(p => all.add(p));
          });
          setParticipants(Array.from(all));
        }
      } catch (e) {
        console.error(e);
        alert("Leaderboard konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tasting.id]);

  return (
    <Container className="py-3 container-mobile">
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Card.Title className="mb-0">Rangliste</Card.Title>
          <small className="text-muted">Durchschnittlicher Rang (kleiner ist besser)</small>
        </Card.Body>
      </Card>

      {!released && !admin && (
        <Alert variant="warning" className="mb-3">
          Die Rangliste ist gesperrt. Nur der Organisator kann eine Vorschau sehen.
        </Alert>
      )}

      {(released || admin) && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Bewertungen anzeigen von:</Form.Label>
            <Form.Select value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="all">Alle (Gesamtwertung)</option>
              {participants.map(p => p && <option key={p} value={p}>{p}</option>)}
            </Form.Select>
          </Form.Group>
          {!released && admin && (
            <Alert variant="info" className="mb-3">Orga‑Preview — nur für dich sichtbar.</Alert>
          )}

          {loading && <div className="text-center my-4"><Spinner animation="border" /></div>}

          {!loading && rows.map((r, i) => {
            // Filter nach Teilnehmer, falls ausgewählt
            let avg = r.avgRank;
            let count = r.count;
            let notes = null;
            let aromas = null;
            if (selected !== 'all' && r.participants && r.participants[selected]) {
              avg = r.participants[selected].avgRank;
              count = r.participants[selected].count;
              notes = r.participants[selected].notes;
              aromas = r.participants[selected].aromas;
            } else if (selected !== 'all') {
              avg = null;
              count = 0;
              notes = null;
              aromas = null;
            }
            return (
              <Card key={r.order} className="mb-3 shadow border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong className="fs-5">
                        #{i + 1} {r.name ? r.name : `Dram ${r.order}`}
                      </strong>
                      {r.broughtBy && (
                        <div className="text-muted small">mitgebracht von {r.broughtBy}</div>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="fs-5 fw-bold">{avg !== null && avg !== undefined ? Number(avg).toFixed(2) : "—"}</div>
                      <small className="text-muted">Ø Rang · n={count ?? 0}</small>
                    </div>
                  </div>
                  {(aromas && aromas.length > 0) && (
                    <div className="mb-2">
                      {aromas.map((a, idx) => (
                        <Badge key={idx} bg="warning" text="dark" className="me-1 mb-1">{a}</Badge>
                      ))}
                    </div>
                  )}
                  {notes && notes.trim() && (
                    <div className="bg-light rounded p-2 mb-1 border fst-italic text-secondary small">
                      {notes}
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </>
      )}
    </Container>
  );
}

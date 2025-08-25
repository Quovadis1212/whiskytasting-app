import { useEffect, useState } from "react";
import { Card, Alert, Container, Spinner } from "react-bootstrap";
import { fetchLeaderboard } from "../api.js";

export default function Leaderboard({ tasting, admin }) {
  const [rows, setRows] = useState([]);
  const [released, setReleased] = useState(tasting.released);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!tasting.id) return;
      setLoading(true);
      try {
        const data = await fetchLeaderboard(tasting.id);
        setRows(data.rows || []);
        setReleased(!!data.released);
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
          {!released && admin && (
            <Alert variant="info" className="mb-3">Orga‑Preview — nur für dich sichtbar.</Alert>
          )}

          {loading && <div className="text-center my-4"><Spinner animation="border" /></div>}

          {!loading && rows.map((r, i) => (
            <Card key={r.order} className="mb-2">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>
                    #{i + 1} {r.name ? r.name : `Dram ${r.order}`}
                  </strong>
                  {r.broughtBy && (
                    <div className="text-muted small">mitgebracht von {r.broughtBy}</div>
                  )}
                </div>
                <div className="text-end">
                  <div><b>{r.avgRank !== null && r.avgRank !== undefined ? Number(r.avgRank).toFixed(2) : "—"}</b></div>
                  <small className="text-muted">Ø Rang · n={r.count ?? 0}</small>
                </div>
              </Card.Body>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
}

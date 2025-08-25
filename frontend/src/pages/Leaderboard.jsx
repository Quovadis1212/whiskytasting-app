import { Card, Alert, Container } from "react-bootstrap";

// pro Teilnehmer Ränge aus Punkten ableiten (desc), Ties -> Durchschnittsposition
function ranksFromPoints(pointsByOrder) {
  const entries = Object.entries(pointsByOrder || {})
    .filter(([, r]) => r && Number.isFinite(r.points))
    .map(([order, r]) => ({ order: Number(order), points: Number(r.points) }));
  if (entries.length === 0) return {};
  entries.sort((a, b) => b.points - a.points);
  const ranks = {};
  let i = 0;
  while (i < entries.length) {
    const start = i;
    const p = entries[i].points;
    while (i < entries.length && entries[i].points === p) i++;
    const end = i - 1;
    const avgRank = (start + 1 + (end + 1)) / 2;
    for (let k = start; k <= end; k++) ranks[entries[k].order] = avgRank;
  }
  return ranks;
}

function computeAverageRanks(tasting) {
  const agg = {};
  for (const [, perDram] of Object.entries(tasting.ratings || {})) {
    const ranks = ranksFromPoints(perDram);
    for (const [orderStr, rank] of Object.entries(ranks)) {
      const order = Number(orderStr);
      if (!agg[order]) agg[order] = { sum: 0, count: 0 };
      agg[order].sum += rank;
      agg[order].count += 1;
    }
  }
  const rows = tasting.drams.map(d => {
    const a = agg[d.order] || { sum: 0, count: 0 };
    const avgRank = a.count ? a.sum / a.count : null;
    return { order: d.order, name: d.name, broughtBy: d.broughtBy, avgRank, count: a.count };
  });
  rows.sort((x, y) => {
    if (x.avgRank === null && y.avgRank === null) return x.order - y.order;
    if (x.avgRank === null) return 1;
    if (y.avgRank === null) return -1;
    if (x.avgRank !== y.avgRank) return x.avgRank - y.avgRank;
    if (y.count !== x.count) return y.count - x.count;
    return x.order - y.order;
  });
  return rows;
}

export default function Leaderboard({ tasting, admin }) {
  const rows = computeAverageRanks(tasting);

  return (
    <Container className="py-3 container-mobile">
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Card.Title className="mb-0">Rangliste</Card.Title>
          <small className="text-muted">Durchschnittlicher Rang (kleiner ist besser)</small>
        </Card.Body>
      </Card>

      {!tasting.released && !admin && (
        <Alert variant="warning" className="mb-3">
          Die Rangliste ist gesperrt. Nur der Organisator kann eine Vorschau sehen.
        </Alert>
      )}

      {(tasting.released || admin) && (
        <>
          {!tasting.released && admin && (
            <Alert variant="info" className="mb-3">Orga‑Preview — nur für dich sichtbar.</Alert>
          )}

          {rows.map((r, i) => (
            <Card key={r.order} className="mb-2">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>
                    #{i + 1} {(tasting.released || admin) ? (r.name || `Dram ${r.order}`) : `Dram ${r.order}`}
                  </strong>
                  <div className="text-muted small">
                    {(tasting.released || admin) && r.broughtBy ? `mitgebracht von ${r.broughtBy}` : ""}
                  </div>
                </div>
                <div className="text-end">
                  <div><b>{r.avgRank !== null ? r.avgRank.toFixed(2) : "—"}</b></div>
                  <small className="text-muted">Ø Rang · n={r.count}</small>
                </div>
              </Card.Body>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
}

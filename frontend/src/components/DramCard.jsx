import { Card, ButtonGroup, Button, Form } from "react-bootstrap";

const SCALE = [0,1,2,3,4,5,6,7,8,9,10];

export default function DramCard({ order, visibleName, rating, onChange }) {
  const points = rating?.points ?? null;
  const title  = visibleName || `Dram ${order}`;
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Card.Subtitle className="text-uppercase">{title}</Card.Subtitle>
          {points !== null && <small className="text-muted">Punkte: <b>{points}</b></small>}
        </div>

        <ButtonGroup className="flex-wrap mb-2">
          {SCALE.map(p => (
            <Button
              key={p}
              size="sm"
              variant={points === p ? "primary" : "outline-primary"}
              className="me-1 mb-1"
              onClick={() => onChange({ points: p })}
            >
              {p}
            </Button>
          ))}
        </ButtonGroup>

        <Form.Label className="text-muted">Notizen</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Nase, Geschmack, Abgang…"
          value={rating?.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Card.Body>
    </Card>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Row, Col, Button, Container } from "react-bootstrap";
import { createTasting, setToken } from "../api.js";

export default function NewTasting() {
  const [title, setTitle] = useState("Blind Tasting #1");
  const [host, setHost] = useState("Orga-Team");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      alert("Bitte Orga‑PIN setzen.");
      return;
    }
    try {
      setBusy(true);
      const data = await createTasting({
        title: title.trim(),
        host: host.trim(),
        organizerPin: pin.trim(),
        drams: []
      });
      setToken(""); // force re-login for admin
      navigate(`/setup?t=${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Tasting konnte nicht erstellt werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-3 container-mobile">
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Card.Title>Neues Tasting anlegen</Card.Title>
          <Form onSubmit={handleCreate} className="mt-2">
            <Row className="g-2">
              <Col xs={12}>
                <Form.Label>Tasting‑Titel</Form.Label>
                <Form.Control value={title} onChange={e=>setTitle(e.target.value)} required />
              </Col>
              <Col xs={12}>
                <Form.Label>Organisator</Form.Label>
                <Form.Control value={host} onChange={e=>setHost(e.target.value)} />
              </Col>
              <Col xs={12}>
                <Form.Label>Orga‑PIN</Form.Label>
                <Form.Control type="password" value={pin} onChange={e=>setPin(e.target.value)} required />
                <Form.Text className="text-muted">Mit dieser PIN loggst du dich später wieder als Orga ein.</Form.Text>
              </Col>
              <Col xs={12} className="d-flex gap-2">
                <Button type="submit" className="btn-cta" disabled={busy}>Erstellen</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

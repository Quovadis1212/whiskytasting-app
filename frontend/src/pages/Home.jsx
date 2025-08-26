import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { fetchActiveTastings, fetchCompletedTastings, fetchTastingByCode } from "../api.js";

export default function Home({ setTasting, participant, setParticipant }) {
  const [activeTastings, setActiveTastings] = useState([]);
  const [completedTastings, setCompletedTastings] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    loadActiveTastings();
    loadCompletedTastings();
  }, []);

  const loadActiveTastings = async () => {
    try {
      setLoading(true);
      const tastings = await fetchActiveTastings();
      setActiveTastings(tastings);
    } catch (err) {
      console.error('Failed to load active tastings:', err);
      setError("Konnte aktive Tastings nicht laden.");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedTastings = async () => {
    try {
      setLoadingCompleted(true);
      const tastings = await fetchCompletedTastings();
      setCompletedTastings(tastings);
    } catch (err) {
      console.error('Failed to load completed tastings:', err);
      // Don't set error for completed tastings, just log it
    } finally {
      setLoadingCompleted(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError("Bitte Code eingeben.");
      return;
    }
    if (!participant.trim()) {
      setError("Bitte Name eingeben.");
      return;
    }

    try {
      setJoining(true);
      setError("");
      const data = await fetchTastingByCode(joinCode.trim());
      setTasting(data);
      nav(`/rate?c=${joinCode.trim()}`);
    } catch (err) {
      console.error('Failed to join tasting:', err);
      setError("Tasting nicht gefunden oder Code ungültig.");
    } finally {
      setJoining(false);
    }
  };

  const joinTasting = (code) => {
    if (!participant.trim()) {
      setError("Bitte erst Namen eingeben.");
      return;
    }
    nav(`/rate?c=${code}`);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container className="py-3 container-mobile">
      <Row className="justify-content-center">
        <Col lg={8}>
          <h1 className="text-center mb-4">Whisky Tasting</h1>
          
          {/* Join by Code Form */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>Tasting beitreten</Card.Title>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleJoinByCode}>
                <Row className="g-2">
                  <Col sm={6}>
                    <Form.Label>Dein Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={participant}
                      onChange={(e) => {
                        setParticipant(e.target.value);
                        setError("");
                      }}
                      placeholder="Name eingeben"
                      required
                    />
                  </Col>
                  <Col sm={4}>
                    <Form.Label>Tasting-Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        setError("");
                      }}
                      placeholder="z.B. ABC123"
                      required
                    />
                  </Col>
                  <Col sm={2} className="d-flex align-items-end">
                    <Button
                      type="submit"
                      className="btn-cta"
                      style={{ height: 'fit-content', alignSelf: 'flex-end' }}
                      disabled={joining}
                    >
                      {joining ? "..." : "Beitreten"}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Active Tastings List */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Aktive Tastings</Card.Title>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => nav("/setup")}
                >
                  Neues Tasting
                </Button>
              </div>

              {loading ? (
                <p className="text-muted">Lade Tastings...</p>
              ) : activeTastings.length === 0 ? (
                <p className="text-muted">Keine aktiven Tastings vorhanden.</p>
              ) : (
                <div className="d-grid gap-2">
                  {activeTastings.map((tasting) => (
                    <Card key={tasting.id} className="border">
                      <Card.Body className="py-2">
                        <Row className="align-items-center">
                          <Col>
                            <h6 className="mb-1">{tasting.title}</h6>
                            <small className="text-muted">
                              von {tasting.host || "Unbekannt"} • {formatDate(tasting.createdAt)}
                            </small>
                          </Col>
                          <Col xs="auto">
                            <code className="me-2">{tasting.joinCode}</code>
                            <Button
                              size="sm"
                              className="btn-cta-outline"
                              onClick={() => joinTasting(tasting.joinCode)}
                              disabled={!participant.trim()}
                            >
                              Beitreten
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Completed Tastings List */}
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Abgeschlossene Tastings</Card.Title>

              {loadingCompleted ? (
                <p className="text-muted">Lade abgeschlossene Tastings...</p>
              ) : completedTastings.length === 0 ? (
                <p className="text-muted">Keine abgeschlossenen Tastings vorhanden.</p>
              ) : (
                <div className="d-grid gap-2">
                  {completedTastings.map((tasting) => (
                    <Card key={tasting.id} className="border">
                      <Card.Body className="py-2">
                        <Row className="align-items-center">
                          <Col>
                            <h6 className="mb-1">{tasting.title}</h6>
                            <small className="text-muted">
                              von {tasting.host || "Unbekannt"} • {formatDate(tasting.createdAt)}
                            </small>
                          </Col>
                          <Col xs="auto">
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => nav(`/board?t=${tasting.id}`)}
                            >
                              Rangliste
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
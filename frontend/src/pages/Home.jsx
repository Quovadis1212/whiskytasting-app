import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { fetchActiveTastings, fetchCompletedTastings } from "../api.js";

export default function Home({ participant, setParticipant }) {
  const [activeTastings, setActiveTastings] = useState([]);
  const [completedTastings, setCompletedTastings] = useState([]);
  // Removed unused joinCode state
  const [loading, setLoading] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  // Removed unused error and joining state to fix lint error
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
  // Optionally show error to user here
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

  // Removed unused handleJoinByCode to fix lint error

  const joinTasting = (code) => {
    let name = participant;
    if (!name || !name.trim()) {
      name = window.prompt("Bitte gib deinen Namen ein:");
      if (!name || !name.trim()) {
  // Optionally show error to user here
        return;
      }
      setParticipant(name);
    }
    // Bewertungen für diesen Teilnehmer merken
    localStorage.setItem("wt_participant", name);
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
          


          {/* Active Tastings List */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Aktive Tastings</Card.Title>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => nav("/new")}
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
                            <Button
                              size="sm"
                              className="btn-cta-outline"
                              onClick={() => joinTasting(tasting.joinCode)}
                              // Button immer aktiv
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
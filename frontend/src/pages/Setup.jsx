import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Row, Col, Button, Container, InputGroup } from "react-bootstrap";
import { createTasting, orgaLogin, setToken, toggleReleased, toggleCompleted, updateSetup } from "../api.js";

export default function Setup({ tasting, setTasting, admin, setAdminState }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(tasting.title || "");
  const [host,  setHost]  = useState(tasting.host || "");
  const [pin,   setPin]   = useState(""); // neue PIN setzen (optional bei Update)
  const [drams, setDrams] = useState([...(tasting.drams || [])].sort((a,b)=>a.order-b.order));
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Quick-Start Form (nur sichtbar wenn noch kein Admin/kein gültiges Tasting geladen)
  const [qsOpen, setQsOpen] = useState(!admin || !tasting?.id);
  const [qsTitle, setQsTitle] = useState("Blind Tasting #1");
  const [qsHost,  setQsHost]  = useState("Orga-Team");
  const [qsPIN,   setQsPIN]   = useState("");

  const joinUrl = useMemo(() => {
    const base = window.location.origin;
    return `${base}/rate?c=${tasting?.joinCode || ""}`;
  }, [tasting?.joinCode]);

  const addDram = () => {
    const next = Math.max(0, ...drams.map(d=>d.order)) + 1;
    setDrams([...drams, { order: next, name: "", broughtBy: "" }]);
  };
  const update = (i, patch) => {
    const copy = drams.slice(); copy[i] = { ...copy[i], ...patch }; setDrams(copy);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(()=>setCopied(false), 1500); }
    catch { alert("Kopieren fehlgeschlagen."); }
  };

  const handleOrgaLogin = async () => {
    const entered = window.prompt("Orga‑PIN eingeben:");
    if (!entered) return;
    try {
      await orgaLogin(tasting.id, entered);
      setAdminState(true);
      alert("Orga‑Modus aktiviert.");
      window.location.reload(); // optional: neu laden, damit Auflösung sichtbar wird
    } catch { alert("Falscher PIN."); }
  };

  const handleToggleReleased = async () => {
    try {
      setBusy(true);
      const next = !tasting.released;
      await toggleReleased(tasting.id, next);
      setTasting(t => ({ ...t, released: next }));
    } catch { alert("Konnte Freigabe nicht ändern."); }
    finally { setBusy(false); }
  };

  const handleToggleCompleted = async () => {
    const next = !tasting.completed;
    if (next && !confirm("Tasting als abgeschlossen markieren? Danach sind keine Änderungen mehr möglich.")) {
      return;
    }
    try {
      setBusy(true);
      await toggleCompleted(tasting.id, next);
      setTasting(t => ({ ...t, completed: next }));
    } catch { alert("Konnte Status nicht ändern."); }
    finally { setBusy(false); }
  };

  const saveSetup = async () => {
    try {
      setBusy(true);
      const payload = { title, host, drams };
      if (pin) payload.organizerPin = pin;
      await updateSetup(tasting.id, payload);
      setTasting(t => ({ ...t, title, host, drams: [...drams].sort((a,b)=>a.order-b.order) }));
      if (pin) { setToken(""); setAdminState(false); alert("PIN geändert. Bitte erneut einloggen."); }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Setup speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  // --- NEW: Quick Start handler ---
  const handleQuickStart = async (e) => {
    e?.preventDefault?.();
    if (!qsPIN.trim()) { alert("Bitte Orga‑PIN setzen."); return; }
    try {
      setBusy(true);
      const data = await createTasting({ title: qsTitle.trim(), host: qsHost.trim(), organizerPin: qsPIN.trim(), drams: [] });
      // {id, joinCode, token}
      setAdminState(true);
      setTasting(t => ({
        ...t,
        id: data.id,
        title: qsTitle.trim(),
        host: qsHost.trim(),
        joinCode: data.joinCode,
        released: false,
        completed: false,
        drams: []
      }));
      setTitle(qsTitle.trim());
      setHost(qsHost.trim());
      setQsPIN("");
      setQsOpen(false);
      // Direkt zur vollständigen Setup-Seite navigieren
      navigate(`/setup?t=${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Tasting konnte nicht erstellt werden.");
    } finally { setBusy(false); }
  };

  return (
    <Container className="py-3 container-mobile">
      {/* ORGA-PANEL */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          {/* Orga-Panel Buttons, ohne Titel und Beschreibung */}
            {/* Entfernt: Orga Login & Steuerung */}
            <div className="d-flex justify-content-end align-items-center mb-2">
              {!admin || !tasting?.id ? (
                <div className="d-flex gap-2">
                  <Button className="btn-cta-outline" size="sm" onClick={() => {
                    if (qsOpen) navigate("/");
                    else setQsOpen(true);
                  }}>
                    {qsOpen ? "Schließen" : "Neues Tasting starten"}
                  </Button>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <Button className={tasting.released ? "btn-cta-outline" : "btn-cta"}
                          disabled={busy || tasting.completed} onClick={handleToggleReleased} size="sm">
                    {tasting.released ? "Blindmodus aktivieren" : "Auflösung freigeben"}
                  </Button>
                  <Button 
                    className="btn-cta"
                    disabled={busy} 
                    onClick={handleToggleCompleted}
                    size="sm"
                  >
                    {tasting.completed ? "Abgeschlossen" : "Abschliessen"}
                  </Button>
                </div>
              )}
            </div>

          {/* NEW: Quick Start Form */}
          {qsOpen && (!admin || !tasting?.id) && (
            <Form onSubmit={handleQuickStart} className="mt-2">
              <Row className="g-2">
                <Col xs={12}>
                  <Form.Label>Tasting‑Titel</Form.Label>
                  <Form.Control value={qsTitle} onChange={e=>setQsTitle(e.target.value)} required/>
                </Col>
                <Col xs={12}>
                  <Form.Label>Organisator</Form.Label>
                  <Form.Control value={qsHost} onChange={e=>setQsHost(e.target.value)}/>
                </Col>
                <Col xs={12}>
                  <Form.Label>Orga‑PIN</Form.Label>
                  <Form.Control type="password" value={qsPIN} onChange={e=>setQsPIN(e.target.value)} required/>
                  <Form.Text className="text-muted">Mit dieser PIN loggst du dich später wieder als Orga ein.</Form.Text>
                </Col>
                <Col xs={12} className="d-flex gap-2">
                  <Button type="submit" className="btn-cta" disabled={busy}>Erstellen</Button>
                  <Button type="button" className="btn-cta-outline" onClick={()=>setQsOpen(false)}>Abbrechen</Button>
                </Col>
              </Row>
            </Form>
          )}

          {/* Link kopieren nur, wenn ein Tasting existiert und admin */}
          {admin && tasting?.id && (
            <div className="mt-3">
              <Form.Label>Tasting‑Link für Teilnehmende</Form.Label>
              <InputGroup>
                <Form.Control readOnly value={joinUrl}/>
                <Button className="btn-cta-outline" onClick={copyLink}>
                  {copied ? "Kopiert!" : "Kopieren"}
                </Button>
              </InputGroup>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* SETUP-FORM nur für Orga */}
      {admin && tasting?.id && (
        <>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Card.Title className="mb-0">Tasting einrichten</Card.Title>
                  <small className="text-muted">
                    {tasting.completed ? "Tasting abgeschlossen (nur Anzeige)" : "Titel, Orga, Drams"}
                  </small>
                </div>
                {!tasting.completed && (
                  <Button className="btn-cta" onClick={addDram}>+ Dram</Button>
                )}
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tasting‑Titel</Form.Label>
                  <Form.Control value={title} onChange={(e)=>setTitle(e.target.value)} 
                                placeholder="Blind Tasting #1" disabled={tasting.completed}/>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Organisator</Form.Label>
                  <Form.Control value={host} onChange={(e)=>setHost(e.target.value)} 
                                placeholder="Orga‑Team" disabled={tasting.completed}/>
                </Form.Group>
                {!tasting.completed && (
                <Form.Group className="mb-3">
                  <Form.Label>Neue Orga‑PIN setzen (optional)</Form.Label>
                  <Form.Control type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="z. B. 1234"/>
                  <Form.Text className="text-muted">Beim Ändern der PIN wirst du ausgeloggt und musst dich neu anmelden.</Form.Text>
                </Form.Group>
                )}
              </Form>
            </Card.Body>
          </Card>

          {drams.map((d,i)=>(
            <Card key={i} className="mb-2">
              <Card.Body>
                <Row className="g-2">
                  <Col xs={4}>
                    <Form.Label>Reihenfolge</Form.Label>
                    <Form.Control type="number" min="1" value={d.order}
                      onChange={e=>update(i,{order: parseInt(e.target.value||"0",10)})}
                      disabled={tasting.completed}/>
                  </Col>
                  <Col xs={8}>
                    <Form.Label>Whisky‑Name (Auflösung)</Form.Label>
                    <Form.Control value={d.name}
                      onChange={e=>update(i,{name: e.target.value})}
                      placeholder="erst nach Freigabe sichtbar"
                      disabled={tasting.completed}/>
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Mitgebracht von (Auflösung)</Form.Label>
                    <Form.Control value={d.broughtBy}
                      onChange={e=>update(i,{broughtBy: e.target.value})}
                      disabled={tasting.completed}/>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}

          <div className="position-fixed bottom-0 start-0 end-0 p-2 bar-gradient">
            <div className="d-flex flex-column gap-2 mx-auto container-mobile align-items-center">
              <Button className="w-100 btn-cta" 
                      disabled={busy || tasting.completed} 
                      onClick={saveSetup}>
                {tasting.completed ? "Abgeschlossen" : "Speichern"}
              </Button>
              {saved && <div className="text-success fw-semibold">Gespeichert!</div>}
            </div>
          </div>
          <div style={{ height: 64 }} />
        </>
      )}
    </Container>
  );
}

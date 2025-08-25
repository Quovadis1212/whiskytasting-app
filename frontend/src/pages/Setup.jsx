import { useMemo, useState } from "react";
import { Card, Form, Row, Col, Button, Container, InputGroup } from "react-bootstrap";
import { setAdmin } from "../store.js";

export default function Setup({ tasting, setTasting, goRate, admin, setAdminState }) {
  const [title, setTitle] = useState(tasting.title);
  const [host,  setHost]  = useState(tasting.host);
  const [pin,   setPin]   = useState(tasting.organizerPin || "");
  const [drams, setDrams] = useState([...tasting.drams].sort((a,b)=>a.order-b.order));
  const [copied, setCopied] = useState(false);

  const addDram = () => {
    const next = Math.max(0, ...drams.map(d=>d.order)) + 1;
    setDrams([...drams, { order: next, name: "", broughtBy: "" }]);
  };
  const update = (i, patch) => {
    const copy = drams.slice(); copy[i] = { ...copy[i], ...patch }; setDrams(copy);
  };
  const save = () => setTasting(t => ({
    ...t,
    title, host,
    organizerPin: pin || t.organizerPin || "",
    drams: [...drams].sort((a,b)=>a.order-b.order)
  }));

  const joinUrl = useMemo(() => {
    const base = window.location.origin;
    const id = tasting?.id || "t";
    return `${base}/rate?t=${encodeURIComponent(id)}`;
  }, [tasting?.id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(()=>setCopied(false), 1500);
    } catch {
      setCopied(false);
      alert("Kopieren fehlgeschlagen.");
    }
  };

  const toggleBlind = () => {
    setTasting(t => ({ ...t, released: !t.released }));
  };

  const handleOrgaLogin = () => {
    const entered = window.prompt("Orga-PIN eingeben:");
    if (entered === (tasting.organizerPin || "")) {
      setAdmin(tasting.id, true);
      setAdminState(true);
      alert("Orga-Modus aktiviert.");
    } else {
      alert("Falscher PIN.");
    }
  };

  return (
    <Container className="py-3 container-mobile">
      {/* ORGA-PANEL */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <Card.Title className="mb-0">Orga</Card.Title>
              <small className="text-muted">Login & Steuerung</small>
            </div>
            {!admin ? (
              <Button className="btn-cta" onClick={handleOrgaLogin}>Orga-Login</Button>
            ) : (
              <Button className={tasting.released ? "btn-cta-outline" : "btn-cta"} onClick={toggleBlind}>
                {tasting.released ? "Blindmodus aktivieren" : "Auflösung freigeben"}
              </Button>
            )}
          </div>

          {admin && (
            <div className="mb-2">
              <Form.Label>Tasting-Link für Teilnehmende</Form.Label>
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

      {/* SETUP-FORM */}
      {admin && (
        <>
          <Card className="mb-3 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Card.Title className="mb-0">Tasting einrichten</Card.Title>
                  <small className="text-muted">Titel, Orga, Drams</small>
                </div>
                <Button className="btn-cta" onClick={addDram}>+ Dram</Button>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tasting-Titel</Form.Label>
                  <Form.Control value={title} onChange={(e)=>setTitle(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Organisator</Form.Label>
                  <Form.Control value={host} onChange={(e)=>setHost(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Orga-PIN</Form.Label>
                  <Form.Control type="password" value={pin} onChange={(e)=>setPin(e.target.value)} />
                </Form.Group>
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
                      onChange={e=>update(i,{order: parseInt(e.target.value||"0",10)})}/>
                  </Col>
                  <Col xs={8}>
                    <Form.Label>Whisky-Name (Auflösung)</Form.Label>
                    <Form.Control value={d.name}
                      onChange={e=>update(i,{name: e.target.value})}/>
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Mitgebracht von</Form.Label>
                    <Form.Control value={d.broughtBy}
                      onChange={e=>update(i,{broughtBy: e.target.value})}/>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}

          <div className="position-fixed bottom-0 start-0 end-0 p-2 bar-gradient">
            <div className="d-flex gap-2 mx-auto container-mobile">
              <Button className="w-50 btn-cta-outline" onClick={save}>Speichern</Button>
              <Button className="w-50 btn-cta" onClick={goRate}>Weiter</Button>
            </div>
          </div>
          <div style={{ height: 64 }} />
        </>
      )}
    </Container>
  );
}

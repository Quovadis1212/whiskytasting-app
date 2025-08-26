import { Navbar, Container, Badge, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Header({ released, admin, tasting, onLeaveTasting }) {
  // Only show the badge if we're in a tasting context
  const showBadge = tasting?.id;
  
  return (
    <Navbar variant="dark" sticky="top">
      <Container className="px-3 container-mobile">
        <Navbar.Brand as={Link} to="/" className="fw-bold" style={{ cursor: 'pointer' }}>
          WhiskyTasting
        </Navbar.Brand>
        <Nav className="me-auto">
          {tasting?.id && <Nav.Link as={Link} to="/rate">Bewertung</Nav.Link>}
          {tasting?.id && <Nav.Link as={Link} to="/board">Rangliste</Nav.Link>}
          {admin && <Nav.Link as={Link} to="/setup">Setup</Nav.Link>}
          {tasting?.id && !admin && (
            <>
              <Nav.Link onClick={() => {
                const entered = window.prompt("Orga‑PIN eingeben:");
                if (!entered) return;
                import("../api").then(api => {
                  api.orgaLogin(tasting.id, entered)
                    .then(() => { window.location.reload(); })
                    .catch(() => alert("Falscher PIN."));
                });
              }} style={{ cursor: 'pointer' }}>
                Orga‑Login
              </Nav.Link>
            </>
          )}
        </Nav>
        {showBadge && released && (
          <Badge bg="success">
            Freigegeben
          </Badge>
        )}
      </Container>
    </Navbar>
  );
}

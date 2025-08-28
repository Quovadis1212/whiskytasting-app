import { Navbar, Container, Badge, Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

export default function Header({ released, admin, tasting }) {
  const location = useLocation();

  let activePath = "";
  if (location.pathname.startsWith("/rate")) { activePath = "/rate"; }
  else if (location.pathname.startsWith("/board")) { activePath = "/board"; }
  else if (location.pathname.startsWith("/setup")) { activePath = "/setup"; }
  else { activePath = "/"; }

  return (
    <Navbar variant="dark" sticky="top">
      <Container className="px-3 container-mobile">
        <Navbar.Brand as={Link} to="/" className="fw-bold" style={{ cursor: 'pointer' }}>
          WhiskyTasting
        </Navbar.Brand>
        <Nav className="me-auto">
          {tasting?.id && (
            <Nav.Link
              as={Link}
              to="/rate"
              className={activePath === "/rate" ? "fw-bold text-warning border-bottom border-warning border-2" : ""}
            >
              Bewertung
            </Nav.Link>
          )}
          {tasting?.id && released && (
            <Nav.Link
              as={Link}
              to="/board"
              className={activePath === "/board" ? "fw-bold text-warning border-bottom border-warning border-2" : ""}
            >
              Rangliste
            </Nav.Link>
          )}
          {admin && (
            <Nav.Link
              as={Link}
              to="/setup"
              className={activePath === "/setup" ? "fw-bold text-warning border-bottom border-warning border-2" : ""}
            >
              Setup
            </Nav.Link>
          )}
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
      </Container>
    </Navbar>
  );
}

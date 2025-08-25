import { Navbar, Container, Badge, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Header({ released, admin, tasting }) {
  return (
    <Navbar variant="dark" sticky="top">
      <Container className="px-3 container-mobile">
        <Navbar.Brand className="fw-bold">WhiskyTasting</Navbar.Brand>
        <Nav className="me-auto">
          {tasting?.id && <Nav.Link as={Link} to="/rate">Bewertung</Nav.Link>}
          {tasting?.id && <Nav.Link as={Link} to="/board">Rangliste</Nav.Link>}
          {admin && <Nav.Link as={Link} to="/">Setup</Nav.Link>}
        </Nav>
        <Badge bg={released ? "success" : "secondary"}>
          {released ? "Freigegeben" : "Blindmodus"}
        </Badge>
      </Container>
    </Navbar>
  );
}

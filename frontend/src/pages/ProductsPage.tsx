
import { useNavigate } from "react-router-dom";

export default function ProductsPage() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login", { replace: true });
  }

  return (
    <main style={{ padding: "32px" }}>
      <h1>Mini Inventory</h1>
      <p>You are signed in successfully.</p>
      <button type="button" onClick={handleLogout}>
        Sign out
      </button>
    </main>
  );
}

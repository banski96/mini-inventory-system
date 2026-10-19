
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import "./LoginPage.css";

interface TokenResponse {
  access: string;
  refresh: string;
}

interface LoginError {
  detail?: string;
  non_field_errors?: string[];
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post<TokenResponse>("token/", {
        username: username.trim(),
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      navigate("/products", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError<LoginError>(err)) {
        const data = err.response?.data;

        setError(
          data?.detail ??
            data?.non_field_errors?.join(" ") ??
            (err.response
              ? "Login failed. Check your username and password."
              : "Unable to connect to the server. Please try again."),
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-icon" aria-hidden="true">
            MI
          </div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Welcome back</h1>
          <p className="login-description">
            Sign in to manage your products and stock.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          Mini Inventory System
        </p>
      </section>
    </main>
  );
}

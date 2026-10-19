
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import api from "../services/api";
import ProductFormModal from "../components/ProductFormModal";
import type {
  Category,
  PaginatedResponse,
  Product,
} from "../types/inventory";
import "./ProductsPage.css";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search to avoid sending a request on every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  // Fetch available categories.
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Category>>(
        "categories/",
      );

      return response.data.results;
    },
  });

  // Fetch products with server-side search, filtering, and pagination.
  const productsQuery = useQuery({
    queryKey: [
      "products",
      {
        page,
        search: debouncedSearch,
        category: selectedCategory,
      },
    ],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Product>>(
        "products/",
        {
          params: {
            page,
            search: debouncedSearch || undefined,
            category: selectedCategory || undefined,
          },
        },
      );

      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  // Delete a product, then refresh the product queries.
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`products/${productId}/`);
    },
    onSuccess: async () => {
      const isLastProductOnPage =
        (productsQuery.data?.results.length ?? 0) === 1 && page > 1;

      if (isLastProductOnPage) {
        setPage((currentPage) => currentPage - 1);
      }

      setDeleteTarget(null);
      setDeleteError("");

      await queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setDeleteError(
            "Your session may have expired. Please sign in again.",
          );
        } else if (!error.response) {
          setDeleteError(
            "Cannot connect to Django. Check that the backend is running.",
          );
        } else {
          setDeleteError(
            "Unable to delete this product. Please try again.",
          );
        }
      } else {
        setDeleteError("An unexpected error occurred.");
      }
    },
  });

  // Map category IDs to names for display in the table.
  const categoryNames = useMemo(() => {
    return new Map(
      (categoriesQuery.data ?? []).map((category) => [
        category.id,
        category.name,
      ]),
    );
  }, [categoriesQuery.data]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login", { replace: true });
  }

  function getErrorMessage(error: Error | null): string {
    if (!error) {
      return "";
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return "Your session has expired or is invalid. Please sign in again.";
      }

      if (!error.response) {
        return "Unable to connect to the server. Check that Django is running.";
      }
    }

    return "Something went wrong while loading inventory. Please try again.";
  }

  function openAddForm() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  function closeDeleteConfirmation() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  const products = productsQuery.data?.results ?? [];
  const totalProducts = productsQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  return (
    <main className="products-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo" aria-hidden="true">
            MI
          </div>

          <div>
            <p className="dashboard-brand-name">Mini Inventory</p>
            <p className="dashboard-brand-caption">
              Inventory management
            </p>
          </div>
        </div>

        <button
          className="logout-button"
          type="button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <p className="page-eyebrow">OVERVIEW</p>
            <h1>Products</h1>
            <p className="page-description">
              Manage your products, pricing, and stock levels.
            </p>
          </div>

          <div className="total-card">
            <span className="total-label">Total products</span>
            <strong>
              {productsQuery.isLoading ? "—" : totalProducts}
            </strong>
          </div>
        </div>

        <section className="inventory-panel">
          <div className="inventory-panel-heading">
            <div>
              <h2>Product inventory</h2>
              <p>Search and filter your inventory records.</p>
            </div>

            <button
              type="button"
              className="primary-button add-product-button"
              onClick={openAddForm}
            >
              + Add product
            </button>
          </div>

          <div className="inventory-filters">
            <div className="search-field">
              <label htmlFor="product-search">Search products</label>
              <input
                id="product-search"
                type="search"
                placeholder="Search by product name..."
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="category-field">
              <label htmlFor="category-filter">Category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All categories</option>

                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {categoriesQuery.isError && (
            <div className="inline-error" role="alert">
              <span>
                Categories could not be loaded. You can still search products.
              </span>

              <button
                type="button"
                onClick={() => void categoriesQuery.refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {productsQuery.isError && (
            <div className="inventory-message error-message" role="alert">
              <h3>Unable to load products</h3>
              <p>{getErrorMessage(productsQuery.error)}</p>

              {axios.isAxiosError(productsQuery.error) &&
                productsQuery.error.response?.status === 401 && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleLogout}
                  >
                    Return to login
                  </button>
                )}

              <button
                type="button"
                className="secondary-button"
                onClick={() => void productsQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          {!productsQuery.isError && productsQuery.isLoading && (
            <div className="inventory-message" role="status">
              <span className="loading-spinner" aria-hidden="true" />
              <p>Loading products...</p>
            </div>
          )}

          {!productsQuery.isError &&
            !productsQuery.isLoading &&
            products.length === 0 && (
              <div className="inventory-message empty-message">
                <div className="empty-symbol" aria-hidden="true">
                  —
                </div>

                <h3>No products found</h3>

                <p>
                  {debouncedSearch || selectedCategory
                    ? "Try changing your search or category filter."
                    : "Your inventory is empty. Add a product to get started."}
                </p>

                {searchInput ||
                debouncedSearch ||
                selectedCategory ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSearchInput("");
                      setDebouncedSearch("");
                      setSelectedCategory("");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={openAddForm}
                  >
                    Add your first product
                  </button>
                )}
              </div>
            )}

          {!productsQuery.isError &&
            !productsQuery.isLoading &&
            products.length > 0 && (
              <>
                <div className="table-summary" aria-live="polite">
                  <span>
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {(page - 1) * PAGE_SIZE + products.length} of{" "}
                    {totalProducts} products
                  </span>

                  {productsQuery.isFetching && (
                    <span className="updating-label">Updating…</span>
                  )}
                </div>

                <div className="table-scroll">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Category</th>
                        <th scope="col">Price</th>
                        <th scope="col">Stock</th>
                        <th scope="col">Status</th>
                        <th scope="col">Created</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-name">
                              {product.name}
                            </div>

                            <div className="product-id">
                              ID #{product.id}
                            </div>
                          </td>

                          <td>
                            {categoryNames.get(product.category) ??
                              `Category #${product.category}`}
                          </td>

                          <td className="price-cell">
                            {Number(product.price).toFixed(2)}
                          </td>

                          <td>
                            <span className="stock-value">
                              {product.stock}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                product.is_active
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              <span className="status-dot" />
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="date-cell">
                            {new Date(
                              product.created_at,
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            <div className="product-row-actions">
                              <button
                                type="button"
                                className="row-action-button"
                                onClick={() => openEditForm(product)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="row-action-button delete-row-button"
                                onClick={() => {
                                  setDeleteError("");
                                  setDeleteTarget(product);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className="pagination-footer">
                  <span className="page-count">
                    Page {page} of {totalPages}
                  </span>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="page-button"
                      disabled={
                        !productsQuery.data?.previous ||
                        productsQuery.isFetching
                      }
                      onClick={() => {
                        setPage((currentPage) => currentPage - 1);
                      }}
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      className="page-button"
                      disabled={
                        !productsQuery.data?.next ||
                        page >= totalPages ||
                        productsQuery.isFetching
                      }
                      onClick={() => {
                        setPage((currentPage) => currentPage + 1);
                      }}
                    >
                      Next
                    </button>
                  </div>
                </footer>
              </>
            )}
        </section>

        <p className="dashboard-footnote">
          Mini Inventory System <span>·</span> Connected to Django REST API
        </p>
      </section>

      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categoriesQuery.data ?? []}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}

      {deleteTarget && (
        <div className="product-modal-backdrop">
          <section
            className="product-modal confirmation-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <header className="product-modal-header">
              <div>
                <h2 id="delete-dialog-title">Delete product?</h2>
                <p id="delete-dialog-description">
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget.name}</strong>? This action cannot be
                  undone.
                </p>
              </div>
            </header>

            <div className="confirmation-content">
              {deleteError && (
                <div className="form-error-summary" role="alert">
                  {deleteError}
                </div>
              )}

              <footer className="confirm-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={deleteMutation.isPending}
                  onClick={closeDeleteConfirmation}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="danger-button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (deleteTarget) {
                      deleteMutation.mutate(deleteTarget.id);
                    }
                  }}
                >
                  {deleteMutation.isPending
                    ? "Deleting..."
                    : "Delete product"}
                </button>
              </footer>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

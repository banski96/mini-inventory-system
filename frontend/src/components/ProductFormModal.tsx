
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../services/api";
import type { Category, Product } from "../types/inventory";
import "./ProductFormModal.css";

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

interface ProductPayload {
  name: string;
  price: string;
  stock: number;
  category: number;
  is_active: boolean;
}

export default function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setName(product?.name ?? "");
    setPrice(product?.price ?? "");
    setStock(String(product?.stock ?? 0));
    setCategory(
      product ? String(product.category) : String(categories[0]?.id ?? ""),
    );
    setIsActive(product?.is_active ?? true);
    setErrors({});
    setFormError("");
  }, [product, categories]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductPayload) => {
      if (product) {
        return api.patch(`products/${product.id}/`, payload);
      }

      return api.post("products/", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    },
    onError: (error: unknown) => {
      setErrors({});
      setFormError("");

      if (axios.isAxiosError<Record<string, unknown>>(error)) {
        const data = error.response?.data;

        if (data && typeof data === "object") {
          const fieldErrors: Record<string, string> = {};

          for (const [key, value] of Object.entries(data)) {
            if (key === "detail" || key === "non_field_errors") {
              continue;
            }

            if (Array.isArray(value)) {
              fieldErrors[key] = value.map(String).join(" ");
            } else if (typeof value === "string") {
              fieldErrors[key] = value;
            }
          }

          setErrors(fieldErrors);

          const detail = data.detail;
          const nonFieldErrors = data.non_field_errors;

          if (typeof detail === "string") {
            setFormError(detail);
          } else if (Array.isArray(nonFieldErrors)) {
            setFormError(nonFieldErrors.map(String).join(" "));
          } else if (!Object.keys(fieldErrors).length) {
            setFormError(
              error.response
                ? "Unable to save the product. Please check your input."
                : "Unable to connect to the server. Check that Django is running.",
            );
          }

          if (error.response?.status === 401) {
            setFormError("Your session may have expired. Please sign in again.");
          }

          return;
        }

        setFormError(
          error.response
            ? "Unable to save the product. Please try again."
            : "Unable to connect to the server. Check that Django is running.",
        );
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedCategory = Number(category);
    const validationErrors: Record<string, string> = {};

    if (!name.trim()) {
      validationErrors.name = "Product name is required.";
    }

    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      validationErrors.price = "Price must be greater than zero.";
    }

    if (!stock.trim() || !Number.isInteger(parsedStock) || parsedStock < 0) {
      validationErrors.stock = "Stock must be a non-negative whole number.";
    }

    if (!category || !Number.isInteger(parsedCategory)) {
      validationErrors.category = "Please select a category.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      price: parsedPrice.toFixed(2),
      stock: parsedStock,
      category: parsedCategory,
      is_active: isActive,
    });
  }

  return (
    <div className="product-modal-backdrop">
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <header className="product-modal-header">
          <div>
            <h2 id="product-modal-title">
              {product ? "Edit product" : "Add product"}
            </h2>
            <p>
              {product
                ? "Update the details for this product."
                : "Enter the details for your new inventory item."}
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close form"
            disabled={saveMutation.isPending}
          >
            ×
          </button>
        </header>

        <form className="product-form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-error-summary" role="alert">
              {formError}
            </div>
          )}

          <div className="product-form-field">
            <label htmlFor="product-name">Product name</label>
            <input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mechanical Keyboard"
              maxLength={255}
              required
              disabled={saveMutation.isPending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "product-name-error" : undefined}
            />
            {errors.name && (
              <span id="product-name-error" className="field-error">
                {errors.name}
              </span>
            )}
          </div>

          <div className="product-form-grid">
            <div className="product-form-field">
              <label htmlFor="product-price">Price</label>
              <input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                required
                disabled={saveMutation.isPending}
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? "product-price-error" : undefined}
              />
              {errors.price && (
                <span id="product-price-error" className="field-error">
                  {errors.price}
                </span>
              )}
            </div>

            <div className="product-form-field">
              <label htmlFor="product-stock">Stock quantity</label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
                disabled={saveMutation.isPending}
                aria-invalid={Boolean(errors.stock)}
                aria-describedby={errors.stock ? "product-stock-error" : undefined}
              />
              {errors.stock && (
                <span id="product-stock-error" className="field-error">
                  {errors.stock}
                </span>
              )}
            </div>
          </div>

          <div className="product-form-field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              disabled={saveMutation.isPending || categories.length === 0}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={
                errors.category ? "product-category-error" : undefined
              }
            >
              <option value="">Select a category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <span id="product-category-error" className="field-error">
                {errors.category}
              </span>
            )}
            {categories.length === 0 && (
              <span className="field-hint">
                Create a category before adding a product.
              </span>
            )}
          </div>

          <label className="active-checkbox">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={saveMutation.isPending}
            />
            <span>
              <strong>Active product</strong>
              <small>Make this product available in the inventory.</small>
            </span>
          </label>

          <footer className="product-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button save-product-button"
              disabled={saveMutation.isPending || categories.length === 0}
            >
              {saveMutation.isPending
                ? "Saving..."
                : product
                  ? "Save changes"
                  : "Create product"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

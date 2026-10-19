
export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  category: number;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

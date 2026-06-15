const API_BASE = "http://localhost:8000/api";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  login: (login: string, haslo: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ login, haslo }) }),
  readerLogin: (login: string, haslo: string) =>
    request("/auth/reader-login", { method: "POST", body: JSON.stringify({ login, haslo }) }),

  // Dashboard
  dashboard: () => request("/dashboard"),

  // Books
  getBooks: (search = "") => request(`/books?search=${encodeURIComponent(search)}`),
  getBook: (id: number) => request(`/books/${id}`),
  addBook: (data: { tytul: string; isbn?: string; rokWydania?: number }) =>
    request("/books", { method: "POST", body: JSON.stringify(data) }),
  updateBook: (id: number, data: { tytul: string; isbn?: string; rokWydania?: number }) =>
    request(`/books/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBook: (id: number) => request(`/books/${id}`, { method: "DELETE" }),

  getBookAuthors: (id: number) => request(`/books/${id}/authors`),

  // Authors
  getAuthors: () => request("/authors"),
  getAuthor: (id: number) => request(`/authors/${id}`),
  addAuthor: (data: { nazwisko: string; imie: string }) =>
    request("/authors", { method: "POST", body: JSON.stringify(data) }),
  updateAuthor: (id: number, data: { nazwisko: string; imie: string }) =>
    request(`/authors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAuthor: (id: number) => request(`/authors/${id}`, { method: "DELETE" }),
  assignAuthor: (idA: number, idK: number) =>
    request(`/authors/${idA}/assign/${idK}`, { method: "POST" }),
  unassignAuthor: (idA: number, idK: number) =>
    request(`/authors/${idA}/assign/${idK}`, { method: "DELETE" }),

  // Copies
  getCopies: (bookId?: number) =>
    request(`/copies${bookId ? `?book_id=${bookId}` : ""}`),
  getCopy: (id: number) => request(`/copies/${id}`),
  addCopy: (idK: number) =>
    request("/copies", { method: "POST", body: JSON.stringify({ idK }) }),
  updateCopyStatus: (id: number, status: string) =>
    request(`/copies/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteCopy: (id: number) => request(`/copies/${id}`, { method: "DELETE" }),

  // Readers
  getReaders: (search = "") => request(`/readers?search=${encodeURIComponent(search)}`),
  getReader: (id: number) => request(`/readers/${id}`),
  getReaderHistory: (id: number) => request(`/readers/${id}/history`),
  addReader: (data: { nazwisko: string; imie: string; email?: string; telefon?: string; login: string; haslo: string }) =>
    request("/readers", { method: "POST", body: JSON.stringify(data) }),
  updateReader: (id: number, data: { nazwisko: string; imie: string; email?: string; telefon?: string; login: string; haslo: string }) =>
    request(`/readers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReader: (id: number) => request(`/readers/${id}`, { method: "DELETE" }),
  updateMyProfile: (data: { nazwisko: string; imie: string; email?: string; telefon?: string; login: string; haslo?: string }) =>
    request("/readers/me", { method: "PUT", body: JSON.stringify(data) }),

  // Borrowings
  getBorrowings: () => request("/borrowings"),
  getBorrowingsHistory: () => request("/borrowings/history"),
  borrow: (idC: number, idE: number, dniNaZwrot = 14) =>
    request("/borrowings/borrow", {
      method: "POST",
      body: JSON.stringify({ idC, idE, dniNaZwrot }),
    }),
  returnCopy: (idW: number) =>
    request("/borrowings/return", { method: "POST", body: JSON.stringify({ idW }) }),

  // Reservations
  getReservations: () => request("/reservations"),
  reserve: (idK: number, idC?: number) =>
    request("/reservations", { method: "POST", body: JSON.stringify({ idK, ...(idC !== undefined ? { idC } : {}) }) }),
  getMyReservations: () => request("/reservations/my"),
  cancelReservation: (idR: number) =>
    request("/reservations/cancel", { method: "POST", body: JSON.stringify({ idR }) }),
  borrowFromReservation: (idR: number, dniNaZwrot = 14) =>
    request(`/reservations/${idR}/borrow`, { method: "POST", body: JSON.stringify({ dniNaZwrot }) }),
};

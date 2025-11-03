# Dashboard API Requirements

Dashboard frontend telah diintegrasikan untuk mengambil data real dari backend. Berikut adalah endpoint API yang diperlukan:

## Base URL
```
http://localhost:8000/api
```

## Required Endpoints

### 1. GET /dashboard/stats
Mengambil statistik dashboard utama

**Query Parameters:**
- `store_uuid` (optional): UUID toko untuk filter data

**Response Format:**
```json
{
  "status": "success",
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "total_orders": 124,
    "total_revenue": 36000000,
    "total_products": 20,
    "total_customers": 175,
    "orders_growth": 12.6,
    "revenue_growth": 24.67,
    "products_growth": -12.2,
    "customers_growth": -16.2
  }
}
```

### 2. GET /dashboard/revenue
Mengambil data revenue untuk chart

**Query Parameters:**
- `store_uuid` (optional): UUID toko untuk filter data
- `period` (optional): 'week' | 'month' | 'year' (default: 'month')

**Response Format:**
```json
{
  "status": "success",
  "message": "Revenue data retrieved successfully",
  "data": [
    {
      "date": "2025-01-01",
      "revenue": 2500000,
      "orders": 45
    },
    {
      "date": "2025-02-01",
      "revenue": 3200000,
      "orders": 52
    }
  ]
}
```

### 3. GET /dashboard/popular-products
Mengambil produk terlaris

**Query Parameters:**
- `store_uuid` (optional): UUID toko untuk filter data
- `limit` (optional): Jumlah produk (default: 5)

**Response Format:**
```json
{
  "status": "success",
  "message": "Popular products retrieved successfully",
  "data": [
    {
      "uuid": "prod-123",
      "name": "Product Name",
      "image": "https://example.com/image.jpg",
      "total_sold": 150,
      "revenue": 7500000
    }
  ]
}
```

### 4. GET /dashboard/recent-orders
Mengambil order terbaru

**Query Parameters:**
- `store_uuid` (optional): UUID toko untuk filter data
- `limit` (optional): Jumlah order (default: 10)

**Response Format:**
```json
{
  "status": "success",
  "message": "Recent orders retrieved successfully",
  "data": [
    {
      "uuid": "order-123",
      "order_number": "ORD-2025-001",
      "customer_name": "John Doe",
      "total": 250000,
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### 5. GET /dashboard/customers
Mengambil data customer

**Query Parameters:**
- `store_uuid` (optional): UUID toko untuk filter data
- `limit` (optional): Jumlah customer (default: 10)

**Response Format:**
```json
{
  "status": "success",
  "message": "Customers retrieved successfully",
  "data": [
    {
      "uuid": "cust-123",
      "name": "John Doe",
      "email": "john@example.com",
      "total_orders": 15,
      "total_spent": 5000000
    }
  ]
}
```

### 6. GET /users/me
Mengambil data user yang sedang login (untuk mendapatkan nama user, store UUID, dan info toko)

**Headers:**
- `Authorization: Bearer {token}`

**Response Format:**
```json
{
  "status": "success",
  "message": "User data retrieved successfully",
  "data": {
    "uuid": "user-123",
    "name": "John Doe",
    "username": "johndoe",
    "email": "owner@example.com",
    "phone": "081234567890",
    "store": {
      "uuid": "store-123",
      "name": "Toko Saya",
      "subdomain": "tokosaya",
      "description": "Toko online terlengkap",
      "logo": "https://example.com/logo.jpg"
    }
  }
}
```

**Catatan:**
- Endpoint ini digunakan untuk:
  1. Menampilkan nama user di dashboard (greeting card)
  2. Mendapatkan store UUID untuk filter data dashboard
  3. Menampilkan nama toko di dashboard
- Field `name` atau `username` akan ditampilkan di greeting card
- Jika user belum memiliki toko, field `store` akan `null`

## Authentication
Semua endpoint dashboard memerlukan authentication token yang disimpan di cookie atau Authorization header:

```
Authorization: Bearer {auth_token}
```

atau

```
Cookie: auth_token={token}
```

## Error Response Format
```json
{
  "status": "error",
  "message": "Error message here",
  "data": null
}
```

## Notes
- Semua endpoint harus memfilter data berdasarkan `store_uuid` jika disediakan
- Jika `store_uuid` tidak disediakan, backend harus mengambil dari user yang sedang login
- Growth percentages dihitung berdasarkan periode sebelumnya
- Revenue dalam format IDR (Indonesian Rupiah)
- Dates dalam format ISO 8601

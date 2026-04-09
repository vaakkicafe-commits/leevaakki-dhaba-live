# Lee Vaakki Dhaba - Product Requirements Document

## Original Problem Statement
Rebuild the "Lee Vaakki Dhaba" Flutter app as a Domino's-style digital ecosystem (Web + App/PWA) with ordering, tracking, and an admin dashboard using React/FastAPI/MongoDB.

## Tech Stack
- **Frontend**: React (CRA), Lucide React icons, Poppins font
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (local in dev, Atlas in production)
- **Mobile**: PWA + Capacitor (Android wrapper configured)

## Core Requirements
- Unified food ordering platform
- Domino's-style UI with trendy icons
- Menu with categories (Starters, Mains, Breads, Combos, Beverages, Desserts)
- Shopping Cart & Checkout with UPI Intent and WhatsApp order confirmations
- Comprehensive Admin Dashboard (Orders, Menu, Coupons, Settings)
- PWA support for mobile installation
- Quantity controls (+/-) and haptic vibration feedback
- Swiggy-style quick view popup on dish image tap

## Completed Features
1. React/FastAPI full-stack migration from Flutter (DONE)
2. MongoDB seeded with 23 menu items across categories (DONE)
3. Domino's-style frontend UI with Lucide React icons (DONE)
4. Admin Dashboard with Tabs: Orders, Menu, Coupons, Settings (DONE)
5. UPI Payment Intent & WhatsApp redirect on checkout success (DONE)
6. PWA (manifest, service-worker, install prompt) (DONE)
7. Capacitor configured for Android (DONE)
8. Quantity controls [- qty +] on menu cards (DONE)
9. Haptic vibration feedback via HTML5 Vibration API (DONE)
10. Navbar branding "Lee Vaakki Dhaba" (DONE)
11. Swiggy-style quick view popup - bottom sheet mobile, centered card desktop (DONE - Apr 9, 2026)
12. Deployment fixes: health check endpoint, auto-seed on startup (DONE - Apr 9, 2026)

## Deployment Changes (Apr 9, 2026)
- Added `GET /api/health` endpoint returning `{"status": "healthy"}` for K8s health probes
- Added `@app.on_event("startup")` that auto-seeds empty databases (for fresh Atlas deployments)
- Extracted seed logic into reusable `_seed_database_if_empty()` function
- Admin user creation is now idempotent (checks for existing admin before inserting)

## Key API Endpoints
- GET /api/health (health check)
- POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- GET /api/menu
- POST /api/orders, GET /api/orders, PUT /api/orders/{id}/status
- GET /api/orders/track/{order_number}
- GET /api/settings, PUT /api/settings
- POST /api/addresses, GET /api/addresses
- POST /api/coupons/validate
- POST /api/payments/upi/create
- POST /api/seed

## DB Schema
- users: {email, password_hash, name, phone, role, is_admin, created_at}
- menu_items: {name, description, price, category, image_url, is_veg, is_bestseller, available}
- orders: {user_id, items, total, status, order_type, delivery_address, payment_method, order_number, estimated_time, status_history, created_at}
- settings: {restaurant_name, address, phone, whatsapp, upi_id, tagline, opening_hours}
- addresses: {user_id, label, address_line, landmark, city, pincode, is_default}

## Backlog / Future Tasks
- **P1**: Razorpay Payment Gateway Integration (needs merchant API keys from user)
- **P2**: WebSocket real-time notifications for Admin (blocked by preview env proxy; polling fallback works)
- **P2**: Native Android APK Build (Capacitor configured; needs Android SDK outside container)
- **P3**: Refactor App.js (~1100 lines) into smaller components (MenuCard, Cart, Checkout)

## Admin Credentials
- Email: admin@leevaakki.com
- Password: admin123

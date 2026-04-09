# Lee Vaakki Dhaba - Digital Ecosystem PRD

## Original Problem Statement
Create a Domino's-style digital ecosystem for Lee Vaakki Dhaba where app and website work together with unified ordering experience.

## Project Overview
A full-stack food ordering platform with React frontend and FastAPI backend, featuring:
- Unified ordering system across web
- Real-time order tracking
- Customer accounts with order history
- Admin dashboard for management

## Tech Stack
- **Frontend:** React 19, React Router, Axios
- **Backend:** FastAPI, Motor (async MongoDB), JWT Auth
- **Database:** MongoDB
- **Styling:** Custom CSS with Poppins font

## User Personas

### 1. Customer (End User)
- Browse menu by categories
- Add items to cart
- Apply coupons for discounts
- Place orders (Delivery/Takeaway/Dine-in)
- Track order status in real-time
- View order history

### 2. Admin
- Manage menu items (CRUD)
- Update order status
- Create/manage coupons
- View sales statistics
- Monitor pending orders

## Core Requirements

### Customer Features ✅
- [x] User registration & login
- [x] Browse menu with categories
- [x] Search & filter (Veg-only)
- [x] Shopping cart management
- [x] Coupon validation & application
- [x] Multiple order types (Delivery/Takeaway/Dine-in)
- [x] Address management
- [x] Order placement
- [x] Real-time order tracking (Domino's style tracker)
- [x] Order history

### Admin Features ✅
- [x] Admin authentication
- [x] Menu management API
- [x] Order status updates
- [x] Coupon management
- [x] Dashboard statistics

## What's Been Implemented (Jan 2026)

### Backend API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user
- GET /api/menu - Get all menu items
- GET /api/menu/categories - Get categories
- GET /api/menu/category/{category} - Filter by category
- GET /api/menu/{item_id} - Get single item
- POST /api/addresses - Add address
- GET /api/addresses - Get user addresses
- DELETE /api/addresses/{id} - Delete address
- POST /api/orders - Create order
- GET /api/orders - Get user orders
- GET /api/orders/{id} - Get order details
- GET /api/orders/track/{order_number} - Track order
- POST /api/coupons/validate - Validate coupon
- Admin: Menu CRUD, Order status, Coupon management, Stats

### Frontend Pages
- Home - Hero, categories, bestsellers, promos
- Menu - Full menu with filters, search, category tabs
- Cart - Items, quantity controls, coupon, summary
- Login/Register - Auth forms
- Checkout - Order type, address, payment selection
- Order Success - Confirmation with order number
- Track Order - Status timeline
- My Orders - Order history

### Database Collections
- users - User accounts with addresses
- menu_items - 23 menu items across 6 categories
- orders - Customer orders with status history
- coupons - Discount codes

## Testing Results
- Backend: 100% (18/18 tests passed)
- Frontend: 95% (all features working)

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Core ordering flow
- [x] User authentication
- [x] Order tracking

### P1 - Important
- [ ] Online payment integration (Razorpay/UPI)
- [ ] WhatsApp order notifications
- [ ] Push notifications
- [ ] Admin dashboard UI (currently API-only)

### P2 - Nice to Have
- [ ] Table reservation system
- [ ] Loyalty points program
- [ ] Customer reviews & ratings
- [ ] Order re-ordering feature
- [ ] Social login (Google)

### P3 - Future
- [ ] Multiple restaurant branches
- [ ] Delivery partner integration
- [ ] Real-time delivery tracking with GPS
- [ ] Kitchen display system

## Next Tasks
1. Add payment gateway integration
2. Build admin dashboard UI
3. Implement WhatsApp notifications
4. Add customer reviews feature

## Deployment
- Current: Emergent Preview Environment
- Production: Vercel (Frontend) + Railway/Render (Backend)

# Launch Roadmap

This file separates what is already complete, what still needs manual setup, and what should be done later for full production hardening.

## 1. Frontend Status

These are already implemented in code:

- premium homepage and product pages
- storefront collection, product, cart, checkout, tracking pages
- admin UI cleanup and schema alignment
- image normalization and repair tooling
- wishlist / saved items flow
- account page
- Google auth UI hooks
- order history page
- signed-in checkout requirement
- account-aware wishlist sync fallback
- cloud wishlist support path

## 2. Must Do Before Public Launch

These are still pending because they require dashboard/database setup outside the codebase:

### A. Supabase Auth Setup

- enable Google provider in Supabase
- create one Google OAuth app in Google Cloud
- put that one app's Client ID and Client Secret into Supabase
- add localhost and production redirect URLs

Important:

- users do **not** add their own Client ID
- your project owner creates **one** Google OAuth app
- that single Client ID/Secret is used by your whole website

### B. Supabase SQL Setup

Run these SQL files in Supabase SQL editor:

- [wishlist_items.sql](/Users/OM/Downloads/Exclusive_Museum-main/supabase/wishlist_items.sql)
- [orders_rls.sql](/Users/OM/Downloads/Exclusive_Museum-main/supabase/orders_rls.sql)
- [admin_rls.sql](/Users/OM/Downloads/Exclusive_Museum-main/supabase/admin_rls.sql)

### C. Manual QA

Check these flows in browser:

- Google sign in
- save to wishlist
- wishlist page
- signed-in checkout
- track order
- order history
- admin login
- admin product pages
- old product images

## 3. Strongly Recommended Next

These are not blockers for staging/demo, but they are important for a real production store:

- move checkout/order creation to backend or edge function
- real payment verification instead of browser-side/manual-only trust
- stricter order ownership model using user id instead of only email
- save addresses in account dashboard
- better error handling and success states

## 4. Current Readiness

### Ready now

- GitHub upload
- staging deploy
- preview/demo use
- internal review

### Not fully ready yet

- public launch with real customer payments and high trust requirements

Reason:

- external Supabase setup is still pending
- backend/payment hardening is still pending

## 5. Best Next Order

1. complete Google auth setup
2. run SQL files
3. do manual QA
4. upload to GitHub / preview deploy
5. then do backend checkout hardening

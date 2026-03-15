# Manual Test Checklist

## Account

1. Open [account.html](/Users/OM/Downloads/Exclusive_Museum-main/products/account.html)
2. Click Google sign in
3. Confirm account chip changes from `Guest` to signed-in state

## Wishlist

1. Open [index.html](/Users/OM/Downloads/Exclusive_Museum-main/products/index.html)
2. Save one product
3. Open [favorites.html](/Users/OM/Downloads/Exclusive_Museum-main/products/favorites.html)
4. Confirm saved item appears
5. Remove it and confirm it disappears

## Checkout

1. Add one item to cart
2. Open [checkout.html](/Users/OM/Downloads/Exclusive_Museum-main/products/checkout.html)
3. Confirm signed-in email is prefilled
4. Confirm button is disabled when signed out
5. Place one test order when signed in

## Tracking

1. After order placement, open [track.html](/Users/OM/Downloads/Exclusive_Museum-main/products/track.html)
2. Confirm order loads by `order_id + phone`

## Order History

1. Open [order-history.html](/Users/OM/Downloads/Exclusive_Museum-main/products/order-history.html)
2. Confirm latest order appears

## Admin

1. Open [login.html](/Users/OM/Downloads/Exclusive_Museum-main/admin/login.html)
2. Confirm admin login works
3. Open products, editor, variants/media, orders
4. Confirm no schema mismatch errors

## Images

1. Check old products
2. Check newly uploaded products
3. Confirm storefront and admin both show images

# Nuber Eats

The Backend of Nuber Eats Clone

## User CRUD:

- Create Account (createAccount)
- Log In (login)
- See Profile (userProfile)
- Edit Profile (editProfile)
- Verify Email (verifyEmail)

## Restaurant CRUD:

- See Categories
- See Restaurants by Category (pagination)
- See Restaurants (pagination)
- See Restaurant
- Search Restaurant

- Create Restaurant
- Edit Restaurant
- Delete Restaurant

- Create Dish
- Edit Dish
- Delete Dish

## Order

- Orders CRUD
- Orders Subscription (Owner, Customer, Delivery)
    - Pending orders (Owner)    
    (s: newOrder) (t: createOrder(newOrder))
    - Order Status (Customer, Delivery, Owner)     
    (s: orderUpdate) (t: editOrder())
    - Pending / PickedUp orders (Delivery)      
    (s: orderUpdate) (t: editOrder())

- Payments (CRON)
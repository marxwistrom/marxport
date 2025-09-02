# E-Commerce REST API

Comprehensive backend API for e-commerce platform with user authentication, product management, order processing, and payment integration. Built with Node.js and Express.

## 🎯 Project Overview

This project demonstrates a complete e-commerce backend API built with modern Node.js technologies. The system handles all core e-commerce functionality including user management, product catalog, shopping cart, order processing, and secure payment integration.

## 🛠 Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe API
- **Validation**: Joi/Express-validator
- **Security**: bcrypt, helmet, cors

## ✨ Key Features

### User Management
- **Authentication**: JWT-based login/logout system
- **Authorization**: Role-based access control (Admin/Customer)
- **User Profiles**: Account management and preferences
- **Password Security**: bcrypt hashing and validation

### Product Management
- **Product Catalog**: CRUD operations for products
- **Categories**: Hierarchical product categorization
- **Inventory Tracking**: Stock level management
- **Search & Filtering**: Advanced product search capabilities

### Shopping Cart
- **Cart Management**: Add, update, remove items
- **Session Handling**: Persistent cart across sessions
- **Price Calculations**: Dynamic pricing and discounts
- **Cart Validation**: Stock availability checks

### Order Processing
- **Order Creation**: Complete order workflow
- **Order Status**: Real-time order tracking
- **Order History**: Customer order management
- **Invoice Generation**: Automated receipt creation

## 🏗 API Architecture

### RESTful Design
```
GET    /api/products          # Get all products
POST   /api/products          # Create new product (Admin)
GET    /api/products/:id      # Get product by ID
PUT    /api/products/:id      # Update product (Admin)
DELETE /api/products/:id      # Delete product (Admin)

POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
GET    /api/auth/profile      # Get user profile
PUT    /api/auth/profile      # Update user profile

GET    /api/cart              # Get user's cart
POST   /api/cart/add          # Add item to cart
PUT    /api/cart/update       # Update cart item
DELETE /api/cart/remove       # Remove item from cart

POST   /api/orders            # Create new order
GET    /api/orders            # Get user's orders
GET    /api/orders/:id        # Get specific order
PUT    /api/orders/:id/status # Update order status (Admin)
```

## 🚀 Implementation Highlights

### Authentication Middleware
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};
```

### Product Search & Filtering
```javascript
app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (category) filter.category = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const products = await Product.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
            
        res.json({ products, totalPages: Math.ceil(await Product.countDocuments(filter) / limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Payment Integration
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/orders/payment', authenticateToken, async (req, res) => {
    try {
        const { amount, currency = 'usd', paymentMethodId } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency,
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
        });
        
        if (paymentIntent.status === 'succeeded') {
            // Create order in database
            const order = await Order.create({
                userId: req.user.id,
                items: req.body.items,
                total: amount,
                paymentIntentId: paymentIntent.id,
                status: 'confirmed'
            });
            
            res.json({ success: true, order });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

## 📊 Database Schema

### User Model
```javascript
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    address: {
        street: String,
        city: String,
        zipCode: String,
        country: String
    }
}, { timestamps: true });
```

### Product Model
```javascript
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    images: [String],
    specifications: mongoose.Schema.Types.Mixed
}, { timestamps: true });
```

### Order Model
```javascript
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentIntentId: String,
    shippingAddress: {
        street: String,
        city: String,
        zipCode: String,
        country: String
    }
}, { timestamps: true });
```

## 🔒 Security Features

### Input Validation
- **Request Validation**: Joi schema validation
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API request throttling

### Authentication Security
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **CORS Configuration**: Cross-origin request handling
- **Helmet Integration**: Security headers

## 📈 Performance Optimization

- **Database Indexing**: Optimized MongoDB indexes
- **Caching**: Redis integration for frequent queries
- **Pagination**: Efficient data loading
- **Connection Pooling**: MongoDB connection optimization

## 📚 Learning Outcomes

This project demonstrates:
- **RESTful API Design**: Proper HTTP methods and status codes
- **Authentication & Authorization**: JWT implementation
- **Database Design**: MongoDB schema design
- **Payment Integration**: Stripe API integration
- **Security Best Practices**: Input validation and protection
- **Error Handling**: Comprehensive error management
- **API Documentation**: Clear endpoint documentation

## 🔗 Repository

**GitHub**: [E-Commerce REST API](https://github.com/marxwistrom/ecommerce-api)

---

*Part of Marx Wiström's Backend Development Portfolio*

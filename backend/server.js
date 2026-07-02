// ============================================================
//  Hillside Coffee — Backend API Server (Node.js + Express)
//  Endpoints:
//    GET  /api/products       → list all products
//    GET  /api/products/:id   → single product
//    POST /api/orders         → place an order
//    GET  /api/orders         → list all orders (admin)
//    GET  /api/cafes          → list pickup cafes
//    GET  /api/health         → health check
// ============================================================

const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── In-memory data store (replace with a real DB in production) ───
let orders = [];
let orderCounter = 1000;

const products = [
  {
    id: 1, name: "Yirgacheffe", origin: "Ethiopia · Washed",
    notes: "Jasmine, lemon zest, honey",
    roast: 0.2, tags: ["light","fruity","floral"],
    price: 18, emoji: "🌸", bg: "#FFF0F5",
    featured: true, badge: "NEW",
    description: "A delicate washed Ethiopian with bright floral aromatics and a clean, tea-like body.",
    weight: "250g", inStock: true
  },
  {
    id: 2, name: "Huila Reserve", origin: "Colombia · Natural",
    notes: "Red cherry, caramel, brown sugar",
    roast: 0.45, tags: ["medium","fruity"],
    price: 19, emoji: "🍒", bg: "#FFF5F0",
    featured: true, badge: "POPULAR",
    description: "A naturally processed Colombian with rich fruit-forward sweetness and a silky finish.",
    weight: "250g", inStock: true
  },
  {
    id: 3, name: "Sidamo Dark", origin: "Ethiopia · Natural",
    notes: "Blueberry, dark chocolate, molasses",
    roast: 0.7, tags: ["dark","fruity"],
    price: 20, emoji: "🫐", bg: "#F3F0FF",
    featured: false, badge: null,
    description: "Bold and brooding, with deep berry notes and a thick, velvety mouthfeel.",
    weight: "250g", inStock: true
  },
  {
    id: 4, name: "Mandheling", origin: "Indonesia · Wet-hulled",
    notes: "Cedar, dark cocoa, earthy",
    roast: 0.9, tags: ["dark"],
    price: 17, emoji: "🪵", bg: "#F5F0EA",
    featured: false, badge: null,
    description: "A classic Indonesian wet-hulled coffee with earthy depth and a long, woody finish.",
    weight: "250g", inStock: true
  },
  {
    id: 5, name: "Marigold Blend", origin: "Brazil · Honey",
    notes: "Almond, caramel, toasted walnut",
    roast: 0.6, tags: ["medium","nutty"],
    price: 16, emoji: "🌰", bg: "#FFF8E8",
    featured: true, badge: "STAFF PICK",
    description: "Our signature house blend — reliable, comforting, and perfect for milk-based drinks.",
    weight: "250g", inStock: true
  },
  {
    id: 6, name: "Kona Estate", origin: "Hawaii · Washed",
    notes: "Macadamia, brown butter, mango",
    roast: 0.4, tags: ["light","nutty","fruity"],
    price: 32, emoji: "🥥", bg: "#F0F8FF",
    featured: false, badge: null,
    description: "One of the world's most prized origins — bright and buttery with tropical complexity.",
    weight: "250g", inStock: true
  },
];

const cafes = [
  {id:1, name:"Hillside Central",  address:"12 Espresso Lane, Downtown",  distance:"0.3 km", open:true,  waitMins:10, emoji:"☕"},
  {id:2, name:"Hillside Westside", address:"88 Brew St, West Quarter",    distance:"1.2 km", open:true,  waitMins:15, emoji:"🏪"},
  {id:3, name:"Hillside Airport",  address:"Terminal 2, Gate B12",        distance:"4.8 km", open:true,  waitMins:5,  emoji:"✈️"},
  {id:4, name:"Hillside Mall",     address:"Upper Ground, City Mall",     distance:"2.1 km", open:false, waitMins:null, emoji:"🛍️"},
];

// ─── Middleware: request logger ───
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'hillside-coffee-api' });
});

// Get all products
app.get('/api/products', (req, res) => {
  const { tag, featured } = req.query;
  let result = products;
  if(tag)      result = result.filter(p => p.tags.includes(tag));
  if(featured) result = result.filter(p => p.featured);
  res.json(result);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if(!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Get all cafes
app.get('/api/cafes', (req, res) => {
  res.json(cafes);
});

// Place an order
app.post('/api/orders', (req, res) => {
  const { items, delivery, total } = req.body;

  // Basic validation
  if(!items || !items.length){
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  if(!delivery || !delivery.mode){
    return res.status(400).json({ error: 'Delivery information is required' });
  }

  // Validate products exist and prices match
  for(const item of items){
    const product = products.find(p => p.id === item.productId);
    if(!product)
      return res.status(400).json({ error: `Product ${item.productId} not found` });
    if(!product.inStock)
      return res.status(400).json({ error: `${product.name} is currently out of stock` });
  }

  const orderId = ++orderCounter;
  const order = {
    orderId,
    status: 'confirmed',
    items,
    delivery,
    total,
    placedAt: new Date().toISOString(),
    estimatedTime: delivery.mode === 'collect'
      ? `Ready in ${delivery.time}`
      : `Delivering ${delivery.date === 0 ? 'today' : 'tomorrow'} at ${delivery.time}`,
  };

  orders.push(order);
  console.log(`✅ New order #${orderId} — ${items.length} item(s) — $${total}`);

  res.status(201).json({
    orderId,
    status: 'confirmed',
    estimatedTime: order.estimatedTime,
    message: 'Order placed successfully. We\'re roasting for you!'
  });
});

// Get all orders (admin endpoint)
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if(!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Start server ───
app.listen(PORT, () => {
  console.log(`\n☕ Hillside Coffee API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/products/:id`);
  console.log(`   POST /api/orders`);
  console.log(`   GET  /api/orders`);
  console.log(`   GET  /api/cafes`);
  console.log(`   GET  /api/health\n`);
});

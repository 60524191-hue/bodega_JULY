const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Sirve los archivos estáticos (index.html, style.css, script.js, yape.jpeg, etc.)
app.use(express.static(path.join(__dirname)));

// Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://60524191_db_user:bodega2026@cluster0.0o16pyl.mongodb.net/bodega_thalia?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
  tlsAllowInvalidCertificates: true
})
  .then(() => console.log('✅ Conectado exitosamente a MongoDB (bodega_thalia)'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err.message));

// Esquema de productos
const productoSchema = new mongoose.Schema({
  title: String,
  category: String,
  categoryName: String,
  price: Number,
  unit: String,
  image: String
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

const Producto = mongoose.model('Producto', productoSchema, 'productos');

// Credenciales de la administradora
const ADMIN_USER = 'july';
const ADMIN_PASS = 'bodega2026';
const ADMIN_TOKEN = 'admin-bodega-july-2026';

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const results = await Producto.find();
    res.json(results);
  } catch (err) {
    console.error('Error al consultar productos:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// Endpoint para iniciar sesión como administradora
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ ok: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
  }
});

// Endpoint para agregar un producto nuevo (solo administradora)
app.post('/api/productos', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (token !== ADMIN_TOKEN) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { title, category, categoryName, price, unit, image } = req.body;
    const nuevoProducto = new Producto({
      title,
      category,
      categoryName,
      price: Number(price),
      unit,
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'
    });

    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (err) {
    console.error('Error al guardar producto:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el producto' });
  }
});

// Iniciar servidor (compatible con Render y localhost)
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
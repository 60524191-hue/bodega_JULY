const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://60524191_db_user:bodega2026@cluster0.0o16pyl.mongodb.net/bodega_thalia?retryWrites=true&w=majority';

const productoSchema = new mongoose.Schema({
  title: String,
  category: String,
  categoryName: String,
  price: Number,
  unit: String,
  image: String
});

const Producto = mongoose.model('Producto', productoSchema, 'productos');

const productosIniciales = [
  {
    title: 'Arroz Extra Superior 1kg',
    category: 'abarrotes',
    categoryName: 'Abarrotes',
    price: 4.50,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'
  },
  {
    title: 'Leche Evaporada 400g',
    category: 'lacteos',
    categoryName: 'Bebidas y lácteos',
    price: 4.20,
    unit: 'lata',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600'
  },
  {
    title: 'Plátano de Seda 1kg',
    category: 'frescos',
    categoryName: 'Frutas y verduras',
    price: 3.50,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600'
  }
];

async function seedDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('🔌 Conectado a MongoDB (bodega_thalia)...');

    await Producto.deleteMany({});
    await Producto.insertMany(productosIniciales);
    console.log('🌱 ¡Productos insertados exitosamente en la colección productos!');
  } catch (err) {
    console.error('❌ Error en el proceso:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Conexión cerrada.');
  }
}

seedDB();
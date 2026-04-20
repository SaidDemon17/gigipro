import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configurar Cloudinary con tus datos
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const sql = neon(process.env.DATABASE_URL);

// ============================================
// INICIALIZAR TABLAS
// ============================================
async function initDB() {
  try {
    // Tabla de usuarios
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(500),
        points INTEGER DEFAULT 0,
        lost_reports INTEGER DEFAULT 0,
        found_reports INTEGER DEFAULT 0,
        dogs_helped INTEGER DEFAULT 0,
        last_name_change TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tabla users lista');

    // Tabla de reportes (con user_id)
    await sql`
      CREATE TABLE IF NOT EXISTS dog_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type VARCHAR(10) NOT NULL,
        name VARCHAR(100),
        breed VARCHAR(100),
        color VARCHAR(50),
        size VARCHAR(50),
        gender VARCHAR(20),
        age VARCHAR(50),
        description TEXT,
        location_address TEXT,
        location_lat DOUBLE PRECISION,
        location_lon DOUBLE PRECISION,
        report_date DATE,
        report_time TIME,
        reward VARCHAR(100),
        contact_name VARCHAR(100),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(100),
        photos TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tabla dog_reports lista');

    // Tabla de actividades
    await sql`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action TEXT,
        points INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tabla user_activities lista');

    // Tabla de comentarios de perfil
    await sql`
      CREATE TABLE IF NOT EXISTS profile_comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        commenter_id INTEGER,
        commenter_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tabla profile_comments lista');

    // Tabla de logros
    await sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        achievement_name VARCHAR(100),
        achieved_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✅ Tabla user_achievements lista');

    console.log('✅ Todas las tablas inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error.message);
  }
}

// ============================================
// ENDPOINTS DE USUARIOS
// ============================================

// Registrar usuario
app.post('/api/users/register', async (req, res) => {
  console.log('📝 POST /api/users/register', req.body?.email);
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email ya registrado' });
    }
    
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C0392B&color=fff`;
    const hashedPassword = Buffer.from(password).toString('base64');
    
    const result = await sql`
      INSERT INTO users (email, password, name, avatar)
      VALUES (${email}, ${hashedPassword}, ${name}, ${avatar})
      RETURNING id, email, name, avatar, points, created_at
    `;
    
    console.log('✅ Usuario registrado:', result[0].email);
    res.json({ success: true, user: result[0] });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar sesión
app.post('/api/users/login', async (req, res) => {
  console.log('📝 POST /api/users/login', req.body?.email);
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Faltan email o contraseña' });
    }
    
    const hashedPassword = Buffer.from(password).toString('base64');
    
    const result = await sql`
      SELECT id, email, name, avatar, points, lost_reports, found_reports, dogs_helped, last_name_change, created_at
      FROM users 
      WHERE email = ${email} AND password = ${hashedPassword}
    `;
    
    console.log('📝 Resultado login:', result.length > 0 ? '✅ Encontrado' : '❌ No encontrado');
    
    if (result.length === 0) {
      return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos' });
    }
    
    res.json({ success: true, user: result[0] });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener ranking
app.get('/api/users/ranking', async (req, res) => {
  try {
    const result = await sql`
      SELECT id, name, avatar, points, lost_reports, found_reports
      FROM users ORDER BY points DESC LIMIT 50
    `;
    res.json(result);
  } catch (error) {
    console.error('❌ Error en ranking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await sql`
      SELECT id, email, name, avatar, points, lost_reports, found_reports, dogs_helped, created_at 
      FROM users WHERE id = ${id}
    `;
    
    if (user.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    const activities = await sql`
      SELECT action, points, created_at FROM user_activities 
      WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 20
    `;
    
    res.json({ success: true, user: user[0], activities });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar puntos
app.post('/api/users/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { pointsToAdd, action, reportType } = req.body;
    
    await sql`UPDATE users SET points = points + ${pointsToAdd} WHERE id = ${id}`;
    
    if (reportType === 'lost') {
      await sql`UPDATE users SET lost_reports = lost_reports + 1 WHERE id = ${id}`;
    } else if (reportType === 'found') {
      await sql`UPDATE users SET found_reports = found_reports + 1 WHERE id = ${id}`;
    }
    
    await sql`
      INSERT INTO user_activities (user_id, action, points) 
      VALUES (${id}, ${action}, ${pointsToAdd})
    `;
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error actualizando puntos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar } = req.body;
    
    if (name) {
      await sql`
        UPDATE users SET name = ${name}, last_name_change = NOW() 
        WHERE id = ${id}
      `;
    }
    
    if (avatar) {
      await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${id}`;
    }
    
    const result = await sql`SELECT id, email, name, avatar, points FROM users WHERE id = ${id}`;
    res.json({ success: true, user: result[0] });
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINTS DE REPORTES
// ============================================

// Subir fotos
app.post('/api/upload', upload.array('photos', 5), (req, res) => {
  console.log('📸 Archivos subidos:', req.files?.length || 0);
  const files = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ success: true, files });
});

// Obtener todos los reportes (SIN user_id para evitar error)
app.get('/api/reports', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        id, type, name, breed, color, size, gender, age, description,
        location_address, location_lat, location_lon,
        report_date as date, report_time as time, reward,
        contact_name, contact_phone, contact_email, photos,
        created_at
      FROM dog_reports 
      ORDER BY created_at DESC
    `;
    console.log(`📋 Enviando ${result.length} reportes`);
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardar nuevo reporte
app.post('/api/reports', async (req, res) => {
  try {
    const data = req.body;
    console.log('📝 Guardando reporte:', data.name);
    
    const result = await sql`
      INSERT INTO dog_reports (
        type, name, breed, color, size, gender, age, description,
        location_address, location_lat, location_lon,
        report_date, report_time, reward,
        contact_name, contact_phone, contact_email, photos
      ) VALUES (
        ${data.type}, ${data.name}, ${data.breed}, ${data.color},
        ${data.size}, ${data.gender}, ${data.age}, ${data.description},
        ${data.location_address}, ${data.location_lat}, ${data.location_lon},
        ${data.date}, ${data.time}, ${data.reward},
        ${data.contact_name}, ${data.contact_phone}, ${data.contact_email},
        ${data.photos || []}
      ) RETURNING *;
    `;
    
    console.log('✅ Reporte guardado ID:', result[0].id);
    res.json({ success: true, report: result[0] });
  } catch (error) {
    console.error('❌ Error guardando reporte:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

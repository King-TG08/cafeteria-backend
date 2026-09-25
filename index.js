// 1. IMPORTACIÓN DE MÓDULOS Y CONFIGURACIÓN DE ENTORNO
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// 2. INICIALIZACIÓN DE LA APP Y VARIABLES DE ENTORNO
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARES globalmente configurados
app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir llamadas desde Vercel o local

// 4. CONFIGURACIÓN DEL POOL DE CONEXIÓN CON SOPORTE SSL (Aiven)
const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { 
        rejectUnauthorized: false 
    }, // Permite la conexión cifrada requerida por Aiven
    waitForConnections: true,
    connectionLimit: 10
});

// 5. DEFINICIÓN DE ENDPOINTS / RUTAS (API REST)

// GET /estudiantes
app.get('/estudiantes', (req, res) => {
    conexion.query('SELECT * FROM estudiantes', (err, r) => 
        err ? res.status(500).send(err) : res.json(r)
    );
});

// GET /productos
app.get('/productos', (req, res) => {
    conexion.query('SELECT * FROM productos', (err, r) => 
        err ? res.status(500).send(err) : res.json(r)
    );
});

// GET /ventas (JOIN múltiple para reporte completo)
app.get('/ventas', (req, res) => {
    const sql = `
        SELECT 
            v.id, 
            e.nombre AS estudiante, 
            p.nombre AS producto, 
            v.cantidad, 
            v.fecha, 
            p.precio, 
            (v.cantidad * p.precio) AS total, 
            v.estudiante_id, 
            v.producto_id 
        FROM ventas v
        INNER JOIN estudiantes e ON v.estudiante_id = e.id
        INNER JOIN productos p ON v.producto_id = p.id
    `;
    conexion.query(sql, (err, resultados) => {
        if (err) return res.status(500).send(err);
        res.json(resultados);
    });
});

// POST /ventas (Insertar nueva venta)
app.post('/ventas', (req, res) => {
    const { estudiante_id, producto_id, cantidad, fecha } = req.body;
    conexion.query(
        'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
        [estudiante_id, producto_id, cantidad, fecha],
        (err) => err ? res.status(500).send(err) : res.send({ message: 'Venta registrada correctamente' })
    );
});

// PUT /ventas/:id (Actualizar venta existente)
app.put('/ventas/:id', (req, res) => {
    const id = req.params.id;
    const { estudiante_id, producto_id, cantidad, fecha } = req.body;
    conexion.query(
        'UPDATE ventas SET estudiante_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',
        [estudiante_id, producto_id, cantidad, fecha, id],
        (err) => err ? res.status(500).send(err) : res.send({ message: `Venta con ID ${id} actualizada` })
    );
});

// DELETE /ventas/:id (Eliminar venta)
app.delete('/ventas/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('DELETE FROM ventas WHERE id=?', [id], (err) =>
        err ? res.status(500).send(err) : res.send({ message: `Venta con ID ${id} eliminada` })
    );
});

// 6. ENCENDIDO DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en puerto ${PORT}`);
});



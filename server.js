const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const { promisify } = require('util');

// Importar los generadores de documentos
const BSI_PW1100_Generator = require('./js/generators/BSI_PW1100_Generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use(express.static('.'));

// Configurar multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/images';
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para generar documento BSI PW1100
app.post('/generate-bsi-pw1100', upload.array('images', 10), async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        console.log('Imágenes recibidas:', req.files?.length || 0);

        // Procesar las imágenes con sus descripciones
        const imagesWithDescriptions = req.files ? req.files.map((file, index) => {
            const descriptionKey = `image_description_${index}`;
            return {
                ...file,
                description: req.body[descriptionKey] || `Imagen ${index + 1}`
            };
        }) : [];

        console.log('Imágenes con descripciones:', imagesWithDescriptions.map(img => ({
            name: img.originalname,
            description: img.description
        })));

        const generator = new BSI_PW1100_Generator();
        const documentBuffer = await generator.generateDocument(req.body, imagesWithDescriptions);

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="BSI_PW1100_Report_${Date.now()}.docx"`);
        
        res.send(documentBuffer);

        // Limpiar archivos temporales después de un tiempo
        setTimeout(() => {
            if (req.files) {
                req.files.forEach(file => {
                    fs.remove(file.path).catch(console.error);
                });
            }
        }, 5000);

    } catch (error) {
        console.error('Error generando documento:', error);
        res.status(500).json({ 
            error: 'Error generando el documento', 
            details: error.message 
        });
    }
});

// Nueva ruta para previsualizar documento BSI PW1100 como PDF
app.post('/preview-bsi-pw1100', upload.array('images', 10), async (req, res) => {
    try {
        console.log('Datos de previsualización recibidos:', req.body);
        console.log('Imágenes de previsualización recibidas:', req.files?.length || 0);

        const imagesWithDescriptions = req.files ? req.files.map((file, index) => {
            const descriptionKey = `image_description_${index}`;
            return {
                ...file,
                description: req.body[descriptionKey] || `Imagen ${index + 1}`
            };
        }) : [];

        const generator = new BSI_PW1100_Generator();
        const documentBuffer = await generator.generateDocument(req.body, imagesWithDescriptions);

        // Convertir el buffer del documento Word a PDF
        const pdfBuffer = await convertAsync(documentBuffer, '.pdf', undefined);

        // Configurar headers para previsualización (mostrar en el navegador)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="BSI_PW1100_Preview.pdf"'); // 'inline' para mostrar en el navegador
        
        res.send(pdfBuffer);

        // Limpiar archivos temporales
        setTimeout(() => {
            if (req.files) {
                req.files.forEach(file => {
                    fs.remove(file.path).catch(console.error);
                });
            }
        }, 5000);

    } catch (error) {
        console.error('Error generando previsualización de documento:', error);
        res.status(500).json({ 
            error: 'Error generando la previsualización del documento', 
            details: error.message 
        });
    }
});

// Ruta para subir imágenes adicionales
app.post('/upload-images', upload.array('images', 10), (req, res) => {
    try {
        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            size: file.size
        }));

        res.json({
            success: true,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error subiendo imágenes:', error);
        res.status(500).json({ 
            error: 'Error subiendo imágenes', 
            details: error.message 
        });
    }
});

// Manejo de errores
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log('Generador de documentos Word para formularios Vivaaerobus');
});

module.exports = app; 
# Sistema de Formularios Vivaaerobus con Generación de Documentos Word

Este sistema permite llenar formularios web y generar automáticamente documentos Word basados en plantillas predefinidas.

## 🚀 Características

- **Formularios Web Interactivos**: Interfaz moderna y responsiva
- **Generación de Documentos Word**: Convierte datos de formularios a documentos .docx
- **Subida de Imágenes**: Permite adjuntar imágenes a los reportes
- **Validación de Campos**: Verifica que todos los campos requeridos estén completos
- **Búsqueda en Selects**: Componente de búsqueda para elementos select con muchas opciones

## 📋 Requisitos Previos

- **Node.js** (versión 14 o superior)
- **npm** (incluido con Node.js)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd FORMS
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```
   
   O para desarrollo con auto-recarga:
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
FORMS/
├── css/                          # Estilos CSS
│   ├── styles.css               # Estilos de la página principal
│   └── forms-common.css         # Estilos comunes para formularios
├── forms/                       # Formularios HTML
│   ├── BSI_PW1100.html         # Formulario BSI PW1100 (con generación Word)
│   ├── BSI_V2500.html          # Formulario BSI V2500
│   ├── spotcheck.html          # Formulario Spot Check
│   └── ...                     # Otros formularios
├── js/                         # JavaScript
│   ├── generators/             # Generadores de documentos Word
│   │   └── BSI_PW1100_Generator.js
│   ├── form-handlers/          # Manejadores de formularios
│   │   └── BSI_PW1100_Handler.js
│   ├── scripts.js              # Scripts de la página principal
│   └── select-search.js        # Componente de búsqueda para selects
├── img/                        # Imágenes
├── plantilla_word/             # Plantillas de Word
│   └── BSI_PW1100.docx        # Plantilla para BSI PW1100
├── uploads/                    # Carpeta para archivos subidos (se crea automáticamente)
├── index.html                  # Página principal
├── server.js                   # Servidor Express
└── package.json               # Configuración del proyecto
```

## 🎯 Uso del Sistema

### Formulario BSI PW1100

1. **Acceder al formulario**
   - Ir a la página principal (`http://localhost:3000`)
   - Hacer clic en "BSI Report Form (PW 1100 ENGINES)"

2. **Llenar el formulario**
   - Completar todos los campos marcados con asterisco (*) - son obligatorios
   - Los campos opcionales pueden dejarse vacíos

3. **Subir imágenes (opcional)**
   - En la sección "Imágenes Adjuntas"
   - Seleccionar una o múltiples imágenes
   - Formatos soportados: JPG, PNG, GIF
   - Máximo 10MB por imagen

4. **Generar documento Word**
   - Hacer clic en el botón "📄 Generar Documento Word"
   - El sistema validará que todos los campos requeridos estén completos
   - Se descargará automáticamente el archivo .docx generado

## 🔧 Configuración de Plantillas Word

Para que la generación de documentos funcione correctamente, la plantilla de Word debe contener marcadores de posición que coincidan con los nombres de los campos del formulario.

### Marcadores en la Plantilla

Los marcadores en la plantilla Word deben seguir el formato: `{nombre_del_campo}`

Ejemplos:
- `{work_order_number}` - Se reemplazará con el número de orden de trabajo
- `{date_of_bsi}` - Se reemplazará con la fecha de BSI
- `{inspected_by}` - Se reemplazará con el nombre del inspector

### Campos Disponibles para BSI PW1100

La plantilla puede usar cualquiera de estos marcadores:

**Información General:**
- `{nombre_registrado}`
- `{work_order_number}`
- `{date_of_bsi}`
- `{inspected_by}`
- `{inspector_stamp}`
- `{station}`
- `{bsi_reason}`
- `{bsi_type}`
- `{references_used}`

**Información de Aeronave:**
- `{aircraft_model}`
- `{aircraft_registration}`
- `{engine_sn}`

**Equipo Utilizado:**
- `{boroscope_type}`
- `{boroscope_sn}`
- `{probe_sn}`

**Secciones de Componentes:**
- `{lpc_stage1_status}`, `{lpc_stage1_remarks}`
- `{lpc_stage2_status}`, `{lpc_stage2_remarks}`
- `{lpc_stage3_status}`, `{lpc_stage3_remarks}`
- `{bearing3_front_status}`, `{bearing3_front_remarks}`
- `{bearing3_rear_status}`, `{bearing3_rear_remarks}`
- `{hpc_stage1_status}` a `{hpc_stage8_status}`
- `{hpc_stage1_remarks}` a `{hpc_stage8_remarks}`
- `{igniter_status}`, `{igniter_remarks}`
- `{fuelnozzle_status}`, `{fuelnozzle_remarks}`
- `{cch_inner_status}`, `{cch_inner_remarks}`
- `{cch_outer_status}`, `{cch_outer_remarks}`
- `{shiplap_status}`, `{shiplap_remarks}`, `{shiplap_dimensions}`
- `{hpt_vane_status}`, `{hpt_vane_remarks}`
- `{hpt_s1_status}`, `{hpt_s1_remarks}`
- `{hpt_s2_status}`, `{hpt_s2_remarks}`
- `{lpt_s1_status}`, `{lpt_s1_remarks}`
- `{lpt_s2_status}`, `{lpt_s2_remarks}`
- `{lpt_s3_status}`, `{lpt_s3_remarks}`

**Disposición Final:**
- `{final_disposition}`
- `{engine_status_bsi}`
- `{new_interval_inspections}`
- `{user_email}`
- `{inspection_time}`
- `{interval_affected}`
- `{interval_next_fc}`
- `{interval_next_fh}`
- `{generation_date}`

## 🔄 Agregar Nuevos Formularios

Para agregar soporte de generación Word a otros formularios:

1. **Crear el generador**
   ```javascript
   // js/generators/NuevoFormulario_Generator.js
   class NuevoFormulario_Generator {
       // Implementar métodos similares a BSI_PW1100_Generator
   }
   ```

2. **Crear el manejador del formulario**
   ```javascript
   // js/form-handlers/NuevoFormulario_Handler.js
   class NuevoFormulario_Handler {
       // Implementar métodos similares a BSI_PW1100_Handler
   }
   ```

3. **Agregar ruta en el servidor**
   ```javascript
   // En server.js
   app.post('/generate-nuevo-formulario', upload.array('images', 10), async (req, res) => {
       // Implementar lógica similar
   });
   ```

4. **Incluir scripts en el HTML**
   ```html
   <script src="../js/form-handlers/NuevoFormulario_Handler.js"></script>
   ```

5. **Crear plantilla Word**
   - Colocar en `plantilla_word/NuevoFormulario.docx`
   - Incluir marcadores `{campo_nombre}` según los campos del formulario

## 🐛 Solución de Problemas

### Error: "No se encontró el formulario"
- Verificar que el script se esté cargando después del HTML
- Comprobar que el formulario tenga la etiqueta `<form>`

### Error: "Error del servidor: 500"
- Verificar que todas las dependencias estén instaladas (`npm install`)
- Comprobar que la plantilla Word exista en la ruta correcta
- Revisar los logs del servidor en la consola

### Las imágenes no se suben
- Verificar que el tamaño de las imágenes sea menor a 10MB
- Comprobar que sean archivos de imagen válidos (JPG, PNG, GIF)

### Los campos no se llenan en el documento Word
- Verificar que los marcadores en la plantilla coincidan exactamente con los nombres de los campos
- Comprobar que los marcadores estén en el formato correcto: `{nombre_campo}`

## 📞 Soporte

Para problemas o preguntas sobre el sistema, revisar:
1. Los logs del servidor en la consola
2. Los errores en la consola del navegador (F12)
3. Verificar que todos los archivos estén en las rutas correctas

## 🔒 Seguridad

- Las imágenes subidas se eliminan automáticamente después de 5 segundos
- Solo se aceptan archivos de imagen
- Límite de tamaño de archivo: 10MB por imagen
- Máximo 10 imágenes por formulario 
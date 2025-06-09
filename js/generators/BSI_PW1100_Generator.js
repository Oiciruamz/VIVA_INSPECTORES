const fs = require('fs-extra');
const path = require('path');
const PizZip = require('pizzip');

class BSI_PW1100_Generator {
    constructor() {
        // Volver a usar la plantilla original
        this.templatePath = path.join(__dirname, '../../plantilla_word/BSI_PW1100.docx');
    }

    async generateDocument(formData, images = []) {
        try {
            console.log('📁 Leyendo plantilla desde:', this.templatePath);
            
            // Verificar que la plantilla existe
            if (!await fs.pathExists(this.templatePath)) {
                throw new Error(`Plantilla no encontrada: ${this.templatePath}`);
            }
            
            // Leer la plantilla
            const templateContent = await fs.readFile(this.templatePath);
            console.log('📄 Plantilla leída exitosamente, tamaño:', templateContent.length, 'bytes');
            
            const zip = new PizZip(templateContent);
            
            // Procesar los datos del formulario
            const processedData = this.processFormData(formData);
            
            console.log('🔄 Reemplazando Content Controls con corchetes...');
            console.log('📊 Datos que se aplicarán:', JSON.stringify(processedData, null, 2));

            // Reemplazar directamente en el XML
            this.replaceContentControls(zip, processedData);

            // Procesar e insertar imágenes si las hay
            if (images && images.length > 0) {
                console.log('🖼️ Procesando', images.length, 'imágenes...');
                await this.insertImages(zip, images);
            }

            // Generar el documento final
            console.log('🔧 Generando buffer del documento...');
            const buffer = zip.generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });
            
            console.log('✅ Documento generado exitosamente');
            console.log('📦 Buffer generado, tamaño:', buffer.length, 'bytes');
            
            return buffer;

        } catch (error) {
            console.error('❌ Error generando documento BSI PW1100:', error);
            console.error('🔍 Stack trace completo:', error.stack);
            throw error;
        }
    }

    replaceContentControls(zip, data) {
        // Obtener el documento XML principal
        const documentXml = zip.files['word/document.xml'];
        if (!documentXml) {
            throw new Error('No se pudo encontrar word/document.xml');
        }
        
        let xmlContent = documentXml.asText();
        
        // También procesar los headers (donde están los campos del encabezado)
        const headerFiles = ['word/header1.xml', 'word/header2.xml', 'word/header3.xml'];
        const headerContents = {};
        
        headerFiles.forEach(headerFile => {
            const headerXml = zip.files[headerFile];
            if (headerXml) {
                console.log(`📄 Procesando ${headerFile}...`);
                headerContents[headerFile] = headerXml.asText();
            }
        });
        
        // Para cada campo de datos, buscar y reemplazar en todos los archivos XML
        Object.keys(data).forEach(key => {
            const value = data[key] || '';
            
            // Buscar patrones con corchetes [Campo] y preservar formato
            const bracketPattern = new RegExp(`\\[${key}\\]`, 'gi');
            
            // Reemplazar en el documento principal con formato negro
            const mainMatches = xmlContent.match(bracketPattern);
            if (mainMatches) {
                console.log(`✅ Encontrado Content Control en documento: [${key}] - Reemplazando con: "${value}"`);
                
                // Reemplazar manteniendo formato y asegurando color negro
                xmlContent = xmlContent.replace(
                    new RegExp(`(<w:t[^>]*>)[^<]*\\[${key}\\][^<]*(</w:t>)`, 'gi'),
                    `$1${this.escapeXml(value)}$2`
                );
                
                // También reemplazar patrones simples
                xmlContent = xmlContent.replace(bracketPattern, this.escapeXml(value));
            }
            
            // Reemplazar en cada header con formato negro
            Object.keys(headerContents).forEach(headerFile => {
                const headerMatches = headerContents[headerFile].match(bracketPattern);
                if (headerMatches) {
                    console.log(`✅ Encontrado Content Control en ${headerFile}: [${key}] - Reemplazando con: "${value}"`);
                    
                    // Reemplazar manteniendo formato y asegurando color negro
                    headerContents[headerFile] = headerContents[headerFile].replace(
                        new RegExp(`(<w:t[^>]*>)[^<]*\\[${key}\\][^<]*(</w:t>)`, 'gi'),
                        `$1${this.escapeXml(value)}$2`
                    );
                    
                    // También reemplazar patrones simples
                    headerContents[headerFile] = headerContents[headerFile].replace(bracketPattern, this.escapeXml(value));
                }
            });
            
            // Si no se encontró en ningún lado, mostrar advertencia
            if (!mainMatches && !Object.values(headerContents).some(content => content.match(bracketPattern))) {
                console.log(`⚠️ No se encontró Content Control: [${key}]`);
            }
        });
        
        // Asegurar que todo el texto tenga color negro (eliminar colores grises)
        xmlContent = this.ensureBlackText(xmlContent);
        Object.keys(headerContents).forEach(headerFile => {
            headerContents[headerFile] = this.ensureBlackText(headerContents[headerFile]);
        });
        
        // Actualizar el archivo XML principal en el ZIP
        zip.file('word/document.xml', xmlContent);
        
        // Actualizar todos los headers modificados en el ZIP
        Object.keys(headerContents).forEach(headerFile => {
            zip.file(headerFile, headerContents[headerFile]);
        });
    }

    escapeXml(text) {
        if (!text) return '';
        
        // Asegurar que el texto sea una cadena
        const textString = String(text);
        
        return textString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    ensureBlackText(xmlContent) {
        // Eliminar colores grises y asegurar texto negro
        // Buscar y eliminar propiedades de color gris
        xmlContent = xmlContent.replace(/<w:color w:val="[0-9A-Fa-f]{6}"[^>]*>/g, '<w:color w:val="000000"/>');
        
        // Asegurar que los runs de texto tengan color negro
        xmlContent = xmlContent.replace(
            /(<w:r[^>]*>)(\s*<w:rPr[^>]*>)(.*?)(<\/w:rPr>)/g,
            (match, openRun, openRPr, rPrContent, closeRPr) => {
                // Si no tiene color, agregar negro
                if (!rPrContent.includes('<w:color')) {
                    rPrContent += '<w:color w:val="000000"/>';
                }
                return openRun + openRPr + rPrContent + closeRPr;
            }
        );
        
        return xmlContent;
    }

    processFormData(formData) {
        console.log('Procesando datos del formulario:', formData);
        
        // Mapear usando los nombres exactos de los Content Controls con corchetes
        const processedData = {
            // Campos principales de la portada
            'Work Order Number': formData.work_order_number || formData.nombre_registrado || '',
            'Internal ID': formData.internal_id || '',
            'Aircraft Registration': formData.aircraft_registration || '',
            'Engine S/N': formData.engine_sn || '',
            'Inspected By': formData.inspected_by || formData.inspector_stamp || '',
            'Aircraft Model': formData.aircraft_model || '',
            'Station': formData.station || '',
            'Inspection Date': formData.inspection_date || formData.date_of_bsi || '',
            'Date of BSI': formData.date_of_bsi || formData.inspection_date || '',
            'References Used': formData.references_used || '',
            'Inspector Stamp': formData.inspector_stamp || formData.inspected_by || '',
            
            // Campos adicionales que pueden estar en el formulario
            'BSI Reason': formData.bsi_reason || '',
            'BSI Type': formData.bsi_type || '',
            'Boroscope Type': formData.boroscope_type || '',
            'Boroscope S/N': formData.boroscope_sn || '',
            'Probe S/N': formData.probe_sn || '',
            
            // Mapear todos los campos LPC
            'LPC STAGE 1': formData.lpc_stage1_status || 'SERVICEABLE',
            'LPC STAGE 2': formData.lpc_stage2_status || 'SERVICEABLE',
            'LPC STAGE 3': formData.lpc_stage3_status || 'SERVICEABLE',
            'LPC Stage 1 Finding / Remarks': formData.lpc_stage1_remarks || '',
            'LPC Stage 2 Finding / Remarks': formData.lpc_stage2_remarks || '',
            'LPC Stage 3 Finding / Remarks': formData.lpc_stage3_remarks || '',
            
            // Mapear todos los campos HPC
            'HPC STAGE 1': formData.hpc_stage1_status || 'SERVICEABLE',
            'HPC STAGE 2': formData.hpc_stage2_status || 'SERVICEABLE',
            'HPC STAGE 3': formData.hpc_stage3_status || 'SERVICEABLE',
            'HPC STAGE 4': formData.hpc_stage4_status || 'SERVICEABLE',
            'HPC STAGE 5': formData.hpc_stage5_status || 'SERVICEABLE',
            'HPC STAGE 6': formData.hpc_stage6_status || 'SERVICEABLE',
            'HPC STAGE 7': formData.hpc_stage7_status || 'SERVICEABLE',
            'HPC STAGE 8': formData.hpc_stage8_status || 'SERVICEABLE',
            'HPC Stage 1 Finding / Remarks': formData.hpc_stage1_remarks || '',
            'HPC Stage 2 Finding / Remarks': formData.hpc_stage2_remarks || '',
            'HPC Stage 3 Finding / Remarks': formData.hpc_stage3_remarks || '',
            'HPC Stage 4 Finding / Remarks': formData.hpc_stage4_remarks || '',
            'HPC Stage 5 Finding / Remarks': formData.hpc_stage5_remarks || '',
            'HPC Stage 6 Finding / Remarks': formData.hpc_stage6_remarks || '',
            'HPC Stage 7 Finding / Remarks': formData.hpc_stage7_remarks || '',
            'HPC Stage 8 Finding / Remarks': formData.hpc_stage8_remarks || '',
            
            // Mapear todos los campos HPT
            'HPT VANE': formData.hpt_vane_status || 'SERVICEABLE',
            'HPT STAGE 1': formData.hpt_stage1_status || 'SERVICEABLE',
            'HPT STAGE 2': formData.hpt_stage2_status || 'SERVICEABLE',
            'HPT VANE Finding / Remarks': formData.hpt_vane_remarks || '',
            'HPT Stage 1 Finding / Remarks': formData.hpt_stage1_remarks || '',
            'HPT Stage 2 Finding / Remarks': formData.hpt_stage2_remarks || '',
            
            // Mapear todos los campos LPT
            'LPT STAGE 1': formData.lpt_stage1_status || 'SERVICEABLE',
            'LPT STAGE 2': formData.lpt_stage2_status || 'SERVICEABLE',
            'LPT STAGE 3': formData.lpt_stage3_status || 'SERVICEABLE',
            'LPT Stage 1 Finding / Remarks': formData.lpt_stage1_remarks || '',
            'LPT Stage 2 Finding / Remarks': formData.lpt_stage2_remarks || '',
            'LPT Stage 3 Finding / Remarks': formData.lpt_stage3_remarks || '',
            
            // Otros campos de componentes
            'IGNITER SEGMENT': formData.igniter_segment_status || 'SERVICEABLE',
            'Igniter Segment Finding / Remarks': formData.igniter_segment_remarks || '',
            'FUEL NOZZLE': formData.fuel_nozzle_status || 'SERVICEABLE',
            'Fuel Noozle Finding / Remarks': formData.fuel_nozzle_remarks || '',
            'CCH INNER LINER': formData.cch_inner_liner_status || 'SERVICEABLE',
            'CCH Inner Liner Finding / Remarks': formData.cch_inner_liner_remarks || '',
            'CCH OUTER LINER': formData.cch_outer_liner_status || 'SERVICEABLE',
            'CCH Outer Liner Finding / Remarks': formData.cch_outer_liner_remarks || '',
            'SHIP LAP': formData.ship_lap_status || 'SERVICEABLE',
            'SHIP LAP DIMENSIONS': formData.ship_lap_dimensions || '',
            'Shiplap Finding / Remarks': formData.ship_lap_remarks || '',
            
            // Campos de bearing seals
            '# 3 BEARING FRONT SEAL': formData.bearing_front_seal_status || 'SERVICEABLE',
            '# 3 BEARING REAR SEAL': formData.bearing_rear_seal_status || 'SERVICEABLE',
            '# 3 Bearing front Seal Finding / Remarks': formData.bearing_front_seal_remarks || '',
            '# 3 Bearing rear Seal Finding / Remarks': formData.bearing_rear_seal_remarks || '',
            
            // Disposición final y otros
            'FINAL DISPOSITION': formData.final_disposition || 'AIRCRAFT RETURNED TO SERVICE',
            'Engine Status BSI': formData.engine_status_bsi || '',
            'New Interval Inspections': formData.new_interval_inspections || '',
            
            // Campos de tiempo y usuario
            'User Email': formData.user_email || '',
            'Inspection Time': formData.inspection_time || '',
            'Generation Date': new Date().toLocaleDateString('es-ES')
        };

        console.log('Datos procesados para Content Controls:', processedData);
        console.log('Total de campos mapeados:', Object.keys(processedData).length);

        return processedData;
    }

    async processImages(images) {
        const processedImages = [];
        
        for (const image of images) {
            try {
                const imageBuffer = await fs.readFile(image.path);
                processedImages.push({
                    name: image.originalname,
                    data: imageBuffer.toString('base64'),
                    type: image.mimetype
                });
            } catch (error) {
                console.error(`Error procesando imagen ${image.originalname}:`, error);
            }
        }

        return processedImages;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    async insertImages(zip, images) {
        try {
            console.log('🖼️ Iniciando inserción de imágenes...');
            
            // Primero, verificar qué imágenes ya existen en la plantilla
            this.logExistingImages(zip);
            
            // Obtener el documento XML principal
            const documentXml = zip.files['word/document.xml'];
            if (!documentXml) {
                throw new Error('No se pudo encontrar word/document.xml');
            }
            
            let xmlContent = documentXml.asText();
            
            // Buscar el texto "SUPPORT IMAGES" en el documento
            const supportImagesIndex = xmlContent.indexOf('SUPPORT IMAGES');
            
            if (supportImagesIndex === -1) {
                console.log('⚠️ No se encontró el texto SUPPORT IMAGES');
                return;
            }
            
            console.log('✅ Encontrado texto SUPPORT IMAGES en posición:', supportImagesIndex);
            
            // Procesar cada imagen
            const imageRows = [];
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                console.log(`📸 Procesando imagen ${i + 1}: ${image.originalname}`);
                console.log(`📝 Descripción recibida:`, image.description);
                console.log(`🔍 Tipo de descripción:`, typeof image.description);
                
                // Leer la imagen
                const imageBuffer = await fs.readFile(image.path);
                
                // Agregar la imagen a los media del documento
                const imageId = `image${i + 1}`;
                const imageExtension = path.extname(image.originalname).toLowerCase();
                
                // Crear relación para la imagen (esto nos dará el nombre único)
                const imageRelation = await this.addImageRelationship(zip, imageId, imageExtension);
                
                // Agregar imagen a word/media/ con el nombre único
                zip.file(`word/media/${imageRelation.imageName}`, imageBuffer);
                
                // Asegurar que la descripción sea una cadena válida
                let description = image.description || `Imagen ${i + 1}`;
                
                // Si la descripción es un array, tomar el primer elemento no vacío
                if (Array.isArray(description)) {
                    description = description.find(desc => desc && desc.trim() !== '') || `Imagen ${i + 1}`;
                }
                
                // Asegurar que sea string y no esté vacío
                description = String(description).trim() || `Imagen ${i + 1}`;
                
                console.log(`📄 Descripción final a usar:`, description);
                
                // Crear fila de tabla con imagen y descripción
                const imageRow = this.createImageTableRow(imageId, imageExtension, description, i + 1, imageRelation.relationshipId);
                imageRows.push(imageRow);
            }
            
            // Crear una tabla completa con las imágenes
            const imagesTable = this.createImagesTable(imageRows);
            
            // Buscar el párrafo que contiene "SUPPORT IMAGES" y insertar la tabla después
            const supportImagesPattern = /<w:p[^>]*>.*?SUPPORT IMAGES.*?<\/w:p>/s;
            const supportImagesParagraph = xmlContent.match(supportImagesPattern);
            
            if (supportImagesParagraph) {
                console.log('✅ Encontrado párrafo SUPPORT IMAGES, insertando tabla después');
                
                // Insertar la tabla después del párrafo
                const insertPosition = xmlContent.indexOf(supportImagesParagraph[0]) + supportImagesParagraph[0].length;
                const beforeInsert = xmlContent.substring(0, insertPosition);
                const afterInsert = xmlContent.substring(insertPosition);
                
                xmlContent = beforeInsert + imagesTable + afterInsert;
            } else {
                console.log('⚠️ No se pudo encontrar el párrafo SUPPORT IMAGES');
                // Como fallback, insertar al final del documento
                const bodyEndIndex = xmlContent.lastIndexOf('</w:body>');
                if (bodyEndIndex !== -1) {
                    const beforeBody = xmlContent.substring(0, bodyEndIndex);
                    const afterBody = xmlContent.substring(bodyEndIndex);
                    xmlContent = beforeBody + imagesTable + afterBody;
                    console.log('✅ Tabla de imágenes insertada al final del documento');
                }
            }
            
            // Actualizar el documento XML
            zip.file('word/document.xml', xmlContent);
            
            console.log('✅ Imágenes insertadas exitosamente');
            
        } catch (error) {
            console.error('❌ Error insertando imágenes:', error);
            throw error;
        }
    }

    getImageMimeType(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp'
        };
        return mimeTypes[extension] || 'image/jpeg';
    }

    async addImageRelationship(zip, imageId, imageExtension) {
        // Obtener el archivo de relaciones
        const relsFile = zip.files['word/_rels/document.xml.rels'];
        if (!relsFile) {
            console.log('⚠️ No se encontró archivo de relaciones');
            return;
        }
        
        let relsContent = relsFile.asText();
        console.log('📋 Relaciones existentes antes de agregar nueva imagen:');
        
        // Encontrar el último ID de relación de forma más segura
        const relationshipMatches = relsContent.match(/Id="rId(\d+)"/g);
        let maxId = 0;
        const existingIds = [];
        
        if (relationshipMatches) {
            relationshipMatches.forEach(match => {
                const id = parseInt(match.match(/\d+/)[0]);
                existingIds.push(id);
                if (id > maxId) maxId = id;
            });
        }
        
        console.log('🔢 IDs de relaciones existentes:', existingIds.sort((a, b) => a - b));
        console.log('🔢 Máximo ID encontrado:', maxId);
        
        // Usar un ID único que no conflicte con los existentes
        let newIdNumber = maxId + 1;
        while (existingIds.includes(newIdNumber)) {
            newIdNumber++;
        }
        
        const newRelId = `rId${newIdNumber}`;
        console.log('🆕 Nuevo ID de relación para imagen:', newRelId);
        
        // Verificar que no estamos reemplazando una relación existente
        if (relsContent.includes(`Id="${newRelId}"`)) {
            console.error('❌ CONFLICTO: El ID de relación ya existe!', newRelId);
            throw new Error(`Conflicto de ID de relación: ${newRelId} ya existe`);
        }
        
        // Agregar nueva relación para la imagen con un nombre único
        const uniqueImageName = `support_${imageId}${imageExtension}`;
        const newRelationship = `<Relationship Id="${newRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${uniqueImageName}"/>`;
        
        // Insertar antes del cierre de Relationships
        relsContent = relsContent.replace('</Relationships>', `${newRelationship}</Relationships>`);
        
        // Actualizar el archivo de relaciones
        zip.file('word/_rels/document.xml.rels', relsContent);
        
        console.log('✅ Relación de imagen agregada exitosamente:', newRelId, '→', uniqueImageName);
        
        return { relationshipId: newRelId, imageName: uniqueImageName };
    }

    createImageTableRow(imageId, imageExtension, description, imageNumber, relationshipId) {
        
        return `
        <w:tr>
            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="4000" w:type="dxa"/>
                </w:tcPr>
                <w:p>
                    <w:r>
                        <w:drawing>
                            <wp:inline distT="0" distB="0" distL="0" distR="0">
                                <wp:extent cx="2286000" cy="1714500"/>
                                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                                <wp:docPr id="${imageNumber}" name="${imageId}"/>
                                <wp:cNvGraphicFramePr>
                                    <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                                </wp:cNvGraphicFramePr>
                                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                                    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                        <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                            <pic:nvPicPr>
                                                <pic:cNvPr id="${imageNumber}" name="${imageId}"/>
                                                <pic:cNvPicPr/>
                                            </pic:nvPicPr>
                                            <pic:blipFill>
                                                <a:blip r:embed="${relationshipId}"/>
                                            </pic:blipFill>
                                            <pic:spPr>
                                                <a:xfrm>
                                                    <a:off x="0" y="0"/>
                                                    <a:ext cx="2286000" cy="1714500"/>
                                                </a:xfrm>
                                                <a:prstGeom prst="rect">
                                                    <a:avLst/>
                                                </a:prstGeom>
                                            </pic:spPr>
                                        </pic:pic>
                                    </a:graphicData>
                                </a:graphic>
                            </wp:inline>
                        </w:drawing>
                    </w:r>
                </w:p>
            </w:tc>
            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="4000" w:type="dxa"/>
                </w:tcPr>
                <w:p>
                    <w:r>
                        <w:rPr>
                            <w:color w:val="000000"/>
                        </w:rPr>
                        <w:t>${this.escapeXml(description)}</w:t>
                    </w:r>
                </w:p>
            </w:tc>
        </w:tr>`;
    }

    createImagesTable(imageRows) {
        // Crear una tabla completa con las filas de imágenes
        return `
        <w:tbl>
            <w:tblPr>
                <w:tblStyle w:val="TableGrid"/>
                <w:tblW w:w="0" w:type="auto"/>
                <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
            </w:tblPr>
            <w:tblGrid>
                <w:gridCol w:w="4000"/>
                <w:gridCol w:w="4000"/>
            </w:tblGrid>
            ${imageRows.join('')}
        </w:tbl>`;
    }

    insertRowsIntoTable(tableXml, imageRows) {
        // Método mantenido para compatibilidad, pero ya no se usa
        const firstRowEndPattern = /<\/w:tr>/;
        const firstRowEndMatch = tableXml.search(firstRowEndPattern);
        
        if (firstRowEndMatch === -1) {
            console.log('⚠️ No se pudo encontrar el final de la primera fila');
            return tableXml;
        }
        
        // Insertar las filas de imágenes después de la primera fila
        const insertPosition = firstRowEndMatch + '</w:tr>'.length;
        const beforeInsert = tableXml.substring(0, insertPosition);
        const afterInsert = tableXml.substring(insertPosition);
        
        return beforeInsert + imageRows.join('') + afterInsert;
    }

    logExistingImages(zip) {
        console.log('🔍 Verificando imágenes existentes en la plantilla...');
        
        // Listar todos los archivos en word/media/
        const mediaFiles = [];
        Object.keys(zip.files).forEach(fileName => {
            if (fileName.startsWith('word/media/')) {
                mediaFiles.push(fileName);
            }
        });
        
        console.log('📁 Archivos de media existentes:', mediaFiles);
        
        // Verificar relaciones existentes
        const relsFile = zip.files['word/_rels/document.xml.rels'];
        if (relsFile) {
            const relsContent = relsFile.asText();
            const imageRelations = relsContent.match(/<Relationship[^>]*Type="[^"]*image"[^>]*>/g);
            if (imageRelations) {
                console.log('🔗 Relaciones de imagen existentes:');
                imageRelations.forEach((rel, index) => {
                    console.log(`   ${index + 1}. ${rel}`);
                });
            }
        }
        
        // Verificar headers para imágenes del encabezado
        const headerFiles = ['word/header1.xml', 'word/header2.xml', 'word/header3.xml'];
        headerFiles.forEach(headerFile => {
            const headerXml = zip.files[headerFile];
            if (headerXml) {
                const headerContent = headerXml.asText();
                const headerImages = headerContent.match(/<a:blip[^>]*r:embed="[^"]*"/g);
                if (headerImages) {
                    console.log(`🖼️ Imágenes en ${headerFile}:`, headerImages);
                }
            }
        });
        
        // Verificar footers para imágenes del pie de página
        const footerFiles = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];
        footerFiles.forEach(footerFile => {
            const footerXml = zip.files[footerFile];
            if (footerXml) {
                const footerContent = footerXml.asText();
                const footerImages = footerContent.match(/<a:blip[^>]*r:embed="[^"]*"/g);
                if (footerImages) {
                    console.log(`🖼️ Imágenes en ${footerFile}:`, footerImages);
                }
            }
        });
    }
}

module.exports = BSI_PW1100_Generator; 
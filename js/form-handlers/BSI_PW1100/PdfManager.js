class PdfManager {
    constructor(handler) {
        this.handler = handler;
    }

    async download() {
        const h = this.handler;
        
        try {
            const btn = h.downloadPdfBtn;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Generando PDF...';
            }

            console.log('🎯 Iniciando generación PDF híbrida...');

            const formData = h.collectFormData();
            const workOrder = formData.work_order_number || 'NO_WO';
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `BSI_PW1100_${workOrder}_${stamp}.pdf`;

            // MÉTODO DIRECTO: Solo jsPDF para evitar problemas de promesas
            console.log('📄 Generando con jsPDF directo...');
            await this.generateWithJsPdfDirect(formData, fileName);
            
            this._showSuccess(fileName);

        } catch (err) {
            console.error('❌ Error PDF:', err);
            this._showError(err.message || err);
        } finally {
            const btn = h.downloadPdfBtn;
            if (btn) {
                btn.disabled = false;
                btn.textContent = '📄 Descargar como PDF';
            }
        }
    }

    async generateWithJsPdfDirect(formData, fileName) {
        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Cargar logo antes de generar páginas
        console.log('🔄 Iniciando carga de logo...');
        const logoData = await this.loadLogoImage();
        console.log('📋 Resultado de carga:', logoData);
        
        if (logoData && logoData.loaded) {
            console.log('🎉 Logo cargado exitosamente!');
            console.log('📐 Dimensiones:', logoData.width, 'x', logoData.height);
        } else {
            console.error('💥 FALLO AL CARGAR LOGO - usando placeholder');
        }
        
        this.generateCoverPage(pdf, formData, logoData);
        pdf.addPage();
        this.generateInfoPage(pdf, formData, logoData);
        pdf.addPage();
        this.generatePage3(pdf, formData, logoData);
        pdf.addPage();
        this.generatePage5(pdf, formData, logoData);

        // Generar páginas de imágenes si hay imágenes adjuntas
        if (formData.image_files_data && formData.image_files_data.length > 0) {
            console.log('🖼️ Generando páginas de imágenes...');
            this.generateImagePages(pdf, formData, logoData);
        } else {
            console.log('📄 No hay imágenes para generar páginas adicionales');
        }

        pdf.save(fileName);
    }

    async loadLogoImage() {
        console.log('🔄 Cargando logo VIVA...');
        
        return new Promise((resolve) => {
            const logoImg = new Image();
            
            logoImg.onload = function() {
                console.log('✅ Logo VIVA cargado:', logoImg.width, 'x', logoImg.height);
                
                try {
                    // Crear canvas para procesar el logo
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = logoImg.width;
                    canvas.height = logoImg.height;
                    
                    // Logo normal (100% opacidad)
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(logoImg, 0, 0);
                    const logoNormal = canvas.toDataURL('image/png');
                    
                    // Logo semi-transparente para fondo (10% opacidad)
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 0.1;
                    ctx.drawImage(logoImg, 0, 0);
                    const logoFondo = canvas.toDataURL('image/png');
                    
                    console.log('✅ Logos procesados exitosamente');
                    console.log('📏 Logo normal length:', logoNormal.length);
                    console.log('📏 Logo fondo length:', logoFondo.length);
                    
                    resolve({
                        normal: logoNormal,
                        fondo: logoFondo,
                        loaded: true,
                        width: logoImg.width,
                        height: logoImg.height
                    });
                    
                } catch (canvasError) {
                    console.error('❌ Error procesando canvas:', canvasError);
                    resolve({ loaded: false });
                }
            };
            
            logoImg.onerror = function(error) {
                console.error('❌ Error cargando logo:', error);
                resolve({ loaded: false });
            };
            
            // Cargar logo con crossOrigin para evitar problemas CORS
            logoImg.crossOrigin = 'anonymous';
            logoImg.src = 'http://localhost:3000/img/Viva_Logo.svg.png';
            
            // Timeout de seguridad
            setTimeout(() => {
                if (!logoImg.complete) {
                    console.warn('⏰ Timeout cargando logo');
                    resolve({ loaded: false });
                }
            }, 5000);
        });
    }

    generateCoverPage(pdf, formData, logoData = null) {
        // CONFIGURACIÓN INICIAL - Fondo blanco, sin bordes externos
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 297, 'F'); // Fondo blanco completo
        
        // HEADER SUPERIOR IZQUIERDO (equivalente a .header-left)
        pdf.setFontSize(8); // 8pt como en CSS
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        pdf.text('Aeroenlaces Nacionales S.A de C.V', 20, 25); // 2cm desde arriba
        pdf.text('AFAC', 20, 30);
        
        // LOGO SUPERIOR DERECHO (equivalente a .header-right-logo)
        if (logoData && logoData.loaded) {
            console.log('🎨 Aplicando logos VIVA al PDF...');
            
            try {
                // Logo superior derecho (normal) - Calcular proporción
                const logoWidth = logoData.width;
                const logoHeight = logoData.height;
                const aspectRatio = logoWidth / logoHeight;
                
                // Definir altura máxima y calcular ancho proporcional
                const maxHeight = 15; // mm
                const proportionalWidth = maxHeight * aspectRatio;
                
                // Si el ancho calculado es muy grande, limitarlo y recalcular altura
                const maxWidth = 35; // mm máximo
                let finalWidth, finalHeight;
                
                if (proportionalWidth <= maxWidth) {
                    finalWidth = proportionalWidth;
                    finalHeight = maxHeight;
                } else {
                    finalWidth = maxWidth;
                    finalHeight = maxWidth / aspectRatio;
                }
                
                // Posición X ajustada para que quede alineado a la derecha
                const logoX = 200 - finalWidth - 5; // 5mm de margen derecho
                
                console.log(`📐 Logo dimensiones: ${logoWidth}x${logoHeight}, ratio: ${aspectRatio.toFixed(2)}`);
                console.log(`📏 Logo final: ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}mm en posición (${logoX.toFixed(1)}, 20)`);
                
                pdf.addImage(logoData.normal, 'PNG', logoX, 20, finalWidth, finalHeight);
                console.log('✅ Logo superior derecho aplicado proporcionalmente');
                
                // LOGO DE FONDO SEMI-TRANSPARENTE (grande, centrado y proporcional)
                const bgAspectRatio = logoData.width / logoData.height;
                
                // Área disponible para logo de fondo (más generosa)
                const maxBgWidth = 120; // mm - más ancho para mejor impacto visual
                const maxBgHeight = 60; // mm - más alto
                
                // Calcular dimensiones manteniendo proporción
                let bgWidth, bgHeight;
                const availableRatio = maxBgWidth / maxBgHeight;
                
                if (bgAspectRatio > availableRatio) {
                    // Logo es más ancho proporcionalmente - limitar por ancho
                    bgWidth = maxBgWidth;
                    bgHeight = maxBgWidth / bgAspectRatio;
                } else {
                    // Logo es más alto proporcionalmente - limitar por altura
                    bgHeight = maxBgHeight;
                    bgWidth = maxBgHeight * bgAspectRatio;
                }
                
                // Centrar perfectamente en la página
                const bgX = (210 - bgWidth) / 2; // 210mm = ancho A4
                const bgY = (297 - bgHeight) / 2; // 297mm = alto A4, centrado absoluto
                
                console.log(`🎨 Logo fondo semi-transparente:`);
                console.log(`   📐 Dimensiones originales: ${logoData.width}x${logoData.height}px`);
                console.log(`   📏 Aspect ratio: ${bgAspectRatio.toFixed(3)}`);
                console.log(`   📦 Dimensiones finales: ${bgWidth.toFixed(1)}x${bgHeight.toFixed(1)}mm`);
                console.log(`   📍 Posición: (${bgX.toFixed(1)}, ${bgY.toFixed(1)})`);
                
                pdf.addImage(logoData.fondo, 'PNG', bgX, bgY, bgWidth, bgHeight);
                console.log('✅ Logo de fondo semi-transparente aplicado');
                
            } catch (logoError) {
                console.error('❌ Error aplicando logos:', logoError);
                console.error('📋 Detalles del error:', logoError.message);
                // Fallback a placeholder
                this.drawLogoPlaceholder(pdf);
            }
        } else {
            console.warn('⚠️ Logo no disponible, usando placeholder');
            this.drawLogoPlaceholder(pdf);
        }
        
        // TÍTULOS PRINCIPALES (equivalente a .main-title)
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14); // 14pt como en CSS
        pdf.setFont('helvetica', 'bold');
        
        // Centrado con margin-top: 1cm = ~28mm desde header
        const titleStartY = 70;
        pdf.text('QUALITY CONTROL DEPARTMENT', 105, titleStartY, { align: 'center' });
        pdf.text('BORESCOPE INSPECTION REPORT', 105, titleStartY + 8, { align: 'center' });
        
        // TÍTULO COVER SHEET (equivalente a .section-title)
        pdf.setFontSize(18); // 18pt como en CSS
        pdf.setFont('helvetica', 'bold');
        // margin-bottom: 1.5cm después de main-title
        pdf.text('COVER SHEET', 105, titleStartY + 25, { align: 'center' });
        
        // CAMPOS DE INFORMACIÓN (equivalente a .field-group)
        let fieldY = titleStartY + 50; // Empezar después del título
        const fieldSpacing = 25; // Espaciado generoso entre campos
        
        // AIRCRAFT MODEL
        pdf.setFontSize(12); // 12pt como .field-label
        pdf.setFont('helvetica', 'bold');
        pdf.text('AIRCRAFT MODEL', 105, fieldY, { align: 'center' });
        
        // Valor con línea punteada (equivalente a .field-placeholder)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const aircraftValue = formData.aircraft_model || '[Aircraft Model]';
        pdf.text(aircraftValue, 105, fieldY + 8, { align: 'center' });
        
        // Línea punteada debajo (border-bottom: 1px dashed #ccc)
        pdf.setDrawColor(204, 204, 204); // #ccc
        pdf.setLineWidth(0.5);
        pdf.setLineDashPattern([2, 2], 0); // Línea punteada
        pdf.line(75, fieldY + 10, 135, fieldY + 10); // min-width: 150px = ~5.3cm
        
        fieldY += fieldSpacing;
        
        // ENGINE S/N
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ENGINE S/N:', 105, fieldY, { align: 'center' });
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const engineValue = formData.engine_sn || '[Engine S/N]';
        pdf.text(engineValue, 105, fieldY + 8, { align: 'center' });
        
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(75, fieldY + 10, 135, fieldY + 10);
        
        fieldY += fieldSpacing;
        
        // A/C REGISTRATION
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('A/C REGISTRATION', 105, fieldY, { align: 'center' });
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const regValue = formData.aircraft_registration || '[Aircraft Registration]';
        pdf.text(regValue, 105, fieldY + 8, { align: 'center' });
        
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(75, fieldY + 10, 135, fieldY + 10);
        
        // FOOTER INFERIOR (equivalente a .footer-bottom)
        // position: absolute; bottom: 0.3cm = 8mm desde abajo
        const footerY = 280; // ~0.3cm desde abajo de 297mm
        
        // INSPECTOR STAMP (equivalente a .footer-stamp)
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const stampValue = formData.inspector_stamp || '[Inspector Stamp]';
        pdf.text(stampValue, 105, footerY - 15, { align: 'center' });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12); // 12pt como en CSS
        pdf.setTextColor(0, 0, 0);
        pdf.text('INSPECTOR STAMP', 105, footerY - 5, { align: 'center' });
        
        // Línea punteada para inspector stamp
        pdf.setLineDashPattern([2, 2], 0);
        pdf.setDrawColor(204, 204, 204);
        pdf.line(75, footerY - 12, 135, footerY - 12);
        
        // FOOTER REV (equivalente a .footer-rev)
        pdf.setLineDashPattern([], 0); // Reset línea sólida
        pdf.setFontSize(9); // 9pt como en CSS
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // #555
        pdf.text('F-QC-018 REV 3 (05-OCT-2021)', 20, 290); // Inferior izquierda
    }

    generateInfoPage(pdf, formData, logoData = null) {
        // CONFIGURACIÓN INICIAL - Fondo blanco, sin bordes externos
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 297, 'F'); // Fondo blanco completo
        
        // LOGO DE FONDO SEMI-TRANSPARENTE (centrado)
        if (logoData && logoData.loaded) {
            const bgAspectRatio = logoData.width / logoData.height;
            const maxBgWidth = 120;
            const maxBgHeight = 60;
            
            let bgWidth, bgHeight;
            const availableRatio = maxBgWidth / maxBgHeight;
            
            if (bgAspectRatio > availableRatio) {
                bgWidth = maxBgWidth;
                bgHeight = maxBgWidth / bgAspectRatio;
            } else {
                bgHeight = maxBgHeight;
                bgWidth = maxBgHeight * bgAspectRatio;
            }
            
            const bgX = (210 - bgWidth) / 2;
            const bgY = (297 - bgHeight) / 2;
            
            pdf.addImage(logoData.fondo, 'PNG', bgX, bgY, bgWidth, bgHeight);
        }
        
        // HEADER SECTION
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('QUALITY CONTROL DEPARTMENT', 105, 25, { align: 'center' });
        pdf.text('BOROSCOPE INSPECTION REPORT', 105, 33, { align: 'center' });
        
        // Logo superior derecho
        if (logoData && logoData.loaded) {
            const aspectRatio = logoData.width / logoData.height;
            const maxHeight = 15;
            const proportionalWidth = Math.min(maxHeight * aspectRatio, 35);
            const finalHeight = proportionalWidth / aspectRatio;
            const logoX = 200 - proportionalWidth - 5;
            
            pdf.addImage(logoData.normal, 'PNG', logoX, 15, proportionalWidth, finalHeight);
        }
        
        let currentY = 45;
        
        // PRIMERA TABLA - INFORMACIÓN GENERAL (4 columnas, 2 filas de datos)
        const tableWidth = 180;  // Ancho original perfecto
        const colWidth = tableWidth / 4;
        const rowHeight = 6;     // Solo altura más pequeña
        
        // Headers de la primera tabla
        pdf.setDrawColor(204, 204, 204);
        pdf.setFillColor(242, 242, 242);
        pdf.setLineWidth(0.5);
        
        const headers1 = ['Work Order Number', 'A/C Registration', 'Engine S/N', 'Inspected By'];
        headers1.forEach((header, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(242, 242, 242);
            pdf.rect(x, currentY, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(header, x + 2, currentY + 4);
        });
        
        currentY += rowHeight;
        
        // Primera fila de datos
        const data1 = [
            formData.work_order_number || '[Work Order Number]',
            formData.aircraft_registration || '[Aircraft Registration]',
            formData.engine_sn || '[Engine S/N]',
            formData.inspected_by || '[Inspected By]'
        ];
        
        data1.forEach((value, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, currentY, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, x + 2, currentY + 4);
        });
        
        currentY += rowHeight;
        
        // Headers de la segunda fila
        const headers2 = ['Internal ID', 'A/C Model', 'Station', 'Inspection Date'];
        headers2.forEach((header, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(242, 242, 242);
            pdf.rect(x, currentY, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(header, x + 2, currentY + 4);
        });
        
        currentY += rowHeight;
        
        // Segunda fila de datos
        const data2 = [
            formData.nombre_registrado || '[Internal ID]',
            formData.aircraft_model || '[Aircraft Model]',
            formData.station || '[Station]',
            formData.date_of_bsi || '[Date of BSI]'
        ];
        
        data2.forEach((value, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, currentY, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, x + 2, currentY + 4);
        });
        
        currentY += rowHeight + 8;
        
        // TABLA REFERENCES USED
        pdf.setFillColor(242, 242, 242);
        pdf.rect(15, currentY, colWidth, rowHeight, 'FD');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('References Used', 17, currentY + 4);
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15 + colWidth, currentY, tableWidth - colWidth, rowHeight, 'FD');
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const referencesText = formData.references_used || '[References Used]';
        pdf.text(referencesText, 17 + colWidth, currentY + 4);
        
        currentY += rowHeight + 8;
        
        /* =====================================================================
           NUEVA TABLA DE INSPECCIÓN CON jsPDF-AutoTable (multipágina)
           – Ajusta alto automáticamente y crea nuevas páginas cuando se llena
           – Repite el encabezado de información general en cada página extra
        ====================================================================== */

        // Verificar disponibilidad del plugin
        if (typeof pdf.autoTable !== 'function') {
            console.error('❌ jsPDF-AutoTable no está disponible. Asegúrate de que la librería se haya cargado.');
        } else {
            // Datos para la tabla
        const inspectionData = [
            ['LPC STAGE 1', formData.lpc_stage1_status, formData.lpc_stage1_remarks],
            ['LPC STAGE 2', formData.lpc_stage2_status, formData.lpc_stage2_remarks],
            ['LPC STAGE 3', formData.lpc_stage3_status, formData.lpc_stage3_remarks],
            ['# 3 BEARING FRONT SEAL', formData.bearing3_front_status, formData.bearing3_front_remarks],
            ['# 3 BEARING REAR SEAL', formData.bearing3_rear_status, formData.bearing3_rear_remarks],
            ['HPC STAGE 1', formData.hpc_stage1_status, formData.hpc_stage1_remarks],
            ['HPC STAGE 2', formData.hpc_stage2_status, formData.hpc_stage2_remarks],
            ['HPC STAGE 3', formData.hpc_stage3_status, formData.hpc_stage3_remarks],
            ['HPC STAGE 4', formData.hpc_stage4_status, formData.hpc_stage4_remarks],
            ['HPC STAGE 5', formData.hpc_stage5_status, formData.hpc_stage5_remarks],
            ['HPC STAGE 6', formData.hpc_stage6_status, formData.hpc_stage6_remarks]
        ];
        
            const bodyRows = inspectionData.map(([sec, stat, rem]) => [
                sec,
                stat || '[Status]',
                rem  || '[Findings / Remarks]'
            ]);

            // Margen inferior para que la tabla no invada el footer
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm en A4
            const footerY = 275;                        // Inicio del footer
            const safetyGap = 6;                        // mm extra de separación
            const bottomMargin = (pageHeight - footerY) + safetyGap;  // 297-275+6 = 28 mm aprox.

            // ---- calcular altura base uniforme por fila ----
            const availableHeight = (footerY - safetyGap) - currentY; // espacio efectivo para tabla
            const distribRows = bodyRows.length + 1; // filas de datos + fila header
            const minCellHeight = Math.max(8, Math.floor((availableHeight / distribRows) - 1));

            // Guardar número de página inicial para saber cuándo repetir encabezado
            const firstPageOfTable = pdf.internal.getCurrentPageInfo().pageNumber;
            const self = this;

            const topMarginTable = currentY; // altura exacta de cabecera

            pdf.autoTable({
                startY: currentY,
                head: [['Section Inspected', 'Status', 'Findings / Remarks']],
                body: bodyRows,
                margin: { left: 15, right: 15, top: topMarginTable, bottom: bottomMargin },
                styles: {
                    fontSize: 7,
                    overflow: 'linebreak',
                    valign: 'top',
                    cellPadding: { top: 1, right: 1, bottom: 1, left: 2 },
                    textColor: [0, 0, 0],
                    lineColor: [204, 204, 204],
                    lineWidth: 0.3,
                    minCellHeight: minCellHeight
                },
                headStyles: {
                    fillColor: [224, 224, 224],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    valign: 'middle',
                    halign: 'left',
                    lineColor: [204, 204, 204],
                    lineWidth: 0.3,
                    cellPadding: { top: 1, right: 1, bottom: 1, left: 2 }
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    lineColor: [204, 204, 204],
                    lineWidth: 0.3,
                    valign: 'top',
                    halign: 'left'
                },
                columnStyles: {
                    0: { cellWidth: 38, fillColor: [242, 242, 242], fontStyle: 'bold' },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 117 }
                },
                alternateRowStyles: { fillColor: [255, 255, 255] },
                didParseCell(data) {
                    // Colorear status
                    if (data.section === 'body' && data.column.index === 1) {
                        const text = (data.cell.text[0] || '').toLowerCase();
                        if (text.includes('no damage')) {
                            data.cell.styles.textColor = [0, 100, 0];
                        } else if (text.includes('damage')) {
                            data.cell.styles.textColor = [150, 0, 0];
             } else {
                            data.cell.styles.textColor = [0, 0, 0];
                        }
                    }
                    // Remarks siempre gris medio
                    if (data.section === 'body' && data.column.index === 2) {
                        data.cell.styles.textColor = [0, 0, 0];
                    }
                },
                didDrawPage(data) {
                    const pageNum = data.pageNumber;

                    // Dibujar encabezado repetido excepto en la primera página de la tabla
                    if (pageNum > firstPageOfTable) {
                        self._drawPageTopHeader(pdf, logoData, 25);
                        self._drawInfoHeader(pdf, formData, 45);
                    }

                    // Dibujar pie de página
                    self._drawFooter(pdf, pageNum);
                }
            });

            // AÑADIR ENCABEZADO A PÁGINAS NUEVAS QUE autoTable PUDO AGREGAR
            const totalPages = pdf.getNumberOfPages();
            if (totalPages > firstPageOfTable) {
                for (let p = firstPageOfTable + 1; p <= totalPages; p++) {
                    pdf.setPage(p);
                    self._drawPageTopHeader(pdf, logoData, 25);
                    self._drawInfoHeader(pdf, formData, 45);
                    self._drawFooter(pdf, p); // reafirmar pie por si fuera necesario
                }
            }
        }

        // Como autoTable ya maneja pies de página, terminamos aquí para evitar duplicados
        return;
    }

    generatePage3(pdf, formData, logoData = null) {
        // CONFIGURACIÓN INICIAL - Fondo blanco
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 297, 'F');
        
        // LOGO DE FONDO SEMI-TRANSPARENTE (centrado)
        if (logoData && logoData.loaded) {
            const bgAspectRatio = logoData.width / logoData.height;
            const maxBgWidth = 120;
            const maxBgHeight = 60;
            
            let bgWidth, bgHeight;
            const availableRatio = maxBgWidth / maxBgHeight;
            
            if (bgAspectRatio > availableRatio) {
                bgWidth = maxBgWidth;
                bgHeight = maxBgWidth / bgAspectRatio;
            } else {
                bgHeight = maxBgHeight;
                bgWidth = maxBgHeight * bgAspectRatio;
            }
            
            const bgX = (210 - bgWidth) / 2;
            const bgY = (297 - bgHeight) / 2;
            
            pdf.addImage(logoData.fondo, 'PNG', bgX, bgY, bgWidth, bgHeight);
        }
        
        // HEADER SECTION
        this._drawPageTopHeader(pdf, logoData, 25);
        
        let currentY = 45;
        
        // HEADER DE INFORMACIÓN GENERAL
        currentY = this._drawInfoHeader(pdf, formData, currentY);
        currentY += 8; // Espaciado después del header
        
        // TABLA DE INSPECCIÓN PÁGINA 3 CON AutoTable
        if (typeof pdf.autoTable !== 'function') {
            console.error('❌ jsPDF-AutoTable no está disponible para página 3.');
            return;
        }
        
        // Datos específicos de la página 3
        const inspectionDataPage3 = [
            ['HPC STAGE 7', formData.hpc_stage7_status, formData.hpc_stage7_remarks],
            ['HPC STAGE 8', formData.hpc_stage8_status, formData.hpc_stage8_remarks],
            ['IGNITER SEGMENT', formData.igniter_status, formData.igniter_remarks],
            ['FUEL NOZZLE', formData.fuelnozzle_status, formData.fuelnozzle_remarks],
            ['CCH INNER LINER', formData.cch_inner_status, formData.cch_inner_remarks],
            ['CCH OUTER LINER', formData.cch_outer_status, formData.cch_outer_remarks],
            ['SHIP LAP', formData.shiplap_status, formData.shiplap_remarks],
            ['SHIP LAP DIMENSIONS', formData.shiplap_dimensions, ''],
            ['HPT VANE', formData.hpt_vane_status, formData.hpt_vane_remarks],
            ['HPT STAGE 1', formData.hpt_s1_status, formData.hpt_s1_remarks],
            ['HPT STAGE 2', formData.hpt_s2_status, formData.hpt_s2_remarks]
        ];
        
        const bodyRowsPage3 = inspectionDataPage3.map(([sec, stat, rem]) => [
            sec,
            stat || '[Status]',
            rem  || '[Findings / Remarks]'
        ]);
        
        // Cálculos de márgenes para página 3
        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerY = 275;
        const safetyGap = 6;
        const bottomMargin = (pageHeight - footerY) + safetyGap;
        
        // Altura uniforme para página 3
        const availableHeight = (footerY - safetyGap) - currentY;
        const distribRows = bodyRowsPage3.length + 1;
        const minCellHeight = Math.max(8, Math.floor((availableHeight / distribRows) - 1));
        
        const firstPageOfTable = pdf.internal.getCurrentPageInfo().pageNumber;
        const self = this;
        const topMarginTable = currentY;
        
        pdf.autoTable({
            startY: currentY,
            head: [['Section Inspected', 'Status', 'Findings / Remarks']],
            body: bodyRowsPage3,
            margin: { left: 15, right: 15, top: topMarginTable, bottom: bottomMargin },
            styles: {
                fontSize: 7,
                overflow: 'linebreak',
                valign: 'top',
                cellPadding: { top: 1, right: 1, bottom: 1, left: 2 },
                textColor: [0, 0, 0],
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                minCellHeight: minCellHeight
            },
            headStyles: {
                fillColor: [224, 224, 224],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                valign: 'middle',
                halign: 'left',
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                cellPadding: { top: 1, right: 1, bottom: 1, left: 2 }
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                valign: 'top',
                halign: 'left'
            },
            columnStyles: {
                0: { cellWidth: 38, fillColor: [242, 242, 242], fontStyle: 'bold' },
                1: { cellWidth: 105 },
                2: { cellWidth: 117 }
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            didParseCell(data) {
                // Colorear status
                if (data.section === 'body' && data.column.index === 1) {
                    const text = (data.cell.text[0] || '').toLowerCase();
                    if (text.includes('no damage')) {
                        data.cell.styles.textColor = [0, 100, 0];
                    } else if (text.includes('damage')) {
                        data.cell.styles.textColor = [150, 0, 0];
                    } else {
                        data.cell.styles.textColor = [0, 0, 0];
                    }
                }
                // Remarks siempre gris medio
                if (data.section === 'body' && data.column.index === 2) {
                    data.cell.styles.textColor = [0, 0, 0];
                }
            },
            didDrawPage(data) {
                const pageNum = data.pageNumber;
                
                // Dibujar encabezado repetido excepto en la primera página de la tabla
                if (pageNum > firstPageOfTable) {
                    self._drawPageTopHeader(pdf, logoData, 25);
                    self._drawInfoHeader(pdf, formData, 45);
                }
                
                // Dibujar pie de página
                self._drawFooter(pdf, pageNum);
            }
        });
        
        // AÑADIR ENCABEZADO A PÁGINAS NUEVAS QUE autoTable PUDO AGREGAR
        const totalPages = pdf.getNumberOfPages();
        if (totalPages > firstPageOfTable) {
            for (let p = firstPageOfTable + 1; p <= totalPages; p++) {
                pdf.setPage(p);
                self._drawPageTopHeader(pdf, logoData, 25);
                self._drawInfoHeader(pdf, formData, 45);
                self._drawFooter(pdf, p);
            }
        }
    }

    generatePage5(pdf, formData, logoData = null) {
        // CONFIGURACIÓN INICIAL - Fondo blanco
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 210, 297, 'F');
        
        // LOGO DE FONDO SEMI-TRANSPARENTE (centrado)
        if (logoData && logoData.loaded) {
            const bgAspectRatio = logoData.width / logoData.height;
            const maxBgWidth = 120;
            const maxBgHeight = 60;
            
            let bgWidth, bgHeight;
            const availableRatio = maxBgWidth / maxBgHeight;
            
            if (bgAspectRatio > availableRatio) {
                bgWidth = maxBgWidth;
                bgHeight = maxBgWidth / bgAspectRatio;
            } else {
                bgHeight = maxBgHeight;
                bgWidth = maxBgHeight * bgAspectRatio;
            }
            
            const bgX = (210 - bgWidth) / 2;
            const bgY = (297 - bgHeight) / 2;
            
            pdf.addImage(logoData.fondo, 'PNG', bgX, bgY, bgWidth, bgHeight);
        }
        
        // HEADER SECTION
        this._drawPageTopHeader(pdf, logoData, 25);
        
        let currentY = 45;
        
        // HEADER DE INFORMACIÓN GENERAL
        currentY = this._drawInfoHeader(pdf, formData, currentY);
        currentY += 8; // Espaciado después del header
        
        // TABLA PEQUEÑA DE INSPECCIÓN PÁGINA 5 (solo 3 filas)
        if (typeof pdf.autoTable !== 'function') {
            console.error('❌ jsPDF-AutoTable no está disponible para página 5.');
            return;
        }
        
        // Datos específicos de la página 5 (solo 3 componentes)
        const inspectionDataPage5 = [
            ['TIC LPT STAGE 1', formData.lpt_s1_status, formData.lpt_s1_remarks],
            ['LPT STAGE 2', formData.lpt_s2_status, formData.lpt_s2_remarks],
            ['LPT STAGE 3', formData.lpt_s3_status, formData.lpt_s3_remarks]
        ];
        
        const bodyRowsPage5 = inspectionDataPage5.map(([sec, stat, rem]) => [
            sec,
            stat || '[Status]',
            rem  || '[Findings / Remarks]'
        ]);
        
        const firstPageOfTable = pdf.internal.getCurrentPageInfo().pageNumber;
        const self = this;
        
        pdf.autoTable({
            startY: currentY,
            head: [['Section Inspected', 'Status', 'Findings / Remarks']],
            body: bodyRowsPage5,
            margin: { left: 15, right: 15 },
            styles: {
                fontSize: 7,
                overflow: 'linebreak',
                valign: 'top',
                cellPadding: { top: 1, right: 1, bottom: 1, left: 2 },
                textColor: [0, 0, 0],
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                minCellHeight: 8
            },
            headStyles: {
                fillColor: [224, 224, 224],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                valign: 'middle',
                halign: 'left',
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                cellPadding: { top: 1, right: 1, bottom: 1, left: 2 }
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                lineColor: [204, 204, 204],
                lineWidth: 0.3,
                valign: 'top',
                halign: 'left'
            },
            columnStyles: {
                0: { cellWidth: 38, fillColor: [242, 242, 242], fontStyle: 'bold' },
                1: { cellWidth: 105 },
                2: { cellWidth: 117 }
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            didParseCell(data) {
                // Colorear status
                if (data.section === 'body' && data.column.index === 1) {
                    const text = (data.cell.text[0] || '').toLowerCase();
                    if (text.includes('no damage')) {
                        data.cell.styles.textColor = [0, 100, 0];
                    } else if (text.includes('damage')) {
                        data.cell.styles.textColor = [150, 0, 0];
                    } else {
                        data.cell.styles.textColor = [0, 0, 0];
                    }
                }
                // Remarks siempre gris medio
                if (data.section === 'body' && data.column.index === 2) {
                    data.cell.styles.textColor = [0, 0, 0];
                }
            }
        });
        
        // Actualizar currentY después de la tabla
        currentY = pdf.lastAutoTable.finalY + 10; // 10mm de espaciado
        
        // FINAL DISPOSITION SECTION
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('FINAL DISPOSITION', 15, currentY);
        currentY += 8;
        
        // Caja de FINAL DISPOSITION
        const dispositionHeight = 25; // altura de la caja
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(15, currentY, 180, dispositionHeight); // caja con bordes
        
        // Texto dentro de la caja
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const dispositionText = formData.final_disposition || '[FINAL DISPOSITION]';
        const wrappedDisposition = pdf.splitTextToSize(dispositionText, 175);
        pdf.text(wrappedDisposition, 17, currentY + 5);
        
        currentY += dispositionHeight + 15; // espaciado después de la caja
        
        // ENGINE STATUS AFTER BSI SECTION
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('ENGINE STATUS AFTER BSI', 15, currentY);
        currentY += 8;
        
        // Caja de ENGINE STATUS
        const statusHeight = 15; // altura de la caja más pequeña
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(15, currentY, 180, statusHeight); // caja con bordes
        
        // Texto dentro de la caja
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Negro
        const statusText = formData.engine_status_bsi || '[Engine Status BSI]';
        const wrappedStatus = pdf.splitTextToSize(statusText, 175);
        pdf.text(wrappedStatus, 17, currentY + 5);
        
        // FOOTER
        this._drawFooter(pdf, pdf.internal.getCurrentPageInfo().pageNumber);
    }

    generateImagePages(pdf, formData, logoData = null) {
        console.log('🖼️ Iniciando generación de páginas de imágenes...');
        
        const imageData = formData.image_files_data || [];
        console.log(`📊 Total de imágenes a procesar: ${imageData.length}`);
        
        if (imageData.length === 0) {
            console.log('📄 No hay imágenes para procesar');
            return;
        }

        // 2 imágenes por página (como en el preview HTML)
        const imagesPerPage = 2;
        const totalImagePages = Math.ceil(imageData.length / imagesPerPage);
        
        console.log(`📚 Páginas de imágenes a crear: ${totalImagePages}`);

        for (let pageIndex = 0; pageIndex < totalImagePages; pageIndex++) {
            const currentPageNumber = pdf.internal.getCurrentPageInfo().pageNumber + 1;
            console.log(`🔄 Creando página de imágenes ${pageIndex + 1}/${totalImagePages} (página PDF ${currentPageNumber})`);
            
            // Nueva página para cada conjunto de imágenes
            pdf.addPage();
            
            // CONFIGURACIÓN INICIAL - Fondo blanco
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 297, 'F');
            
            // LOGO DE FONDO SEMI-TRANSPARENTE (centrado)
            if (logoData && logoData.loaded) {
                const bgAspectRatio = logoData.width / logoData.height;
                const maxBgWidth = 120;
                const maxBgHeight = 60;
                
                let bgWidth, bgHeight;
                const availableRatio = maxBgWidth / maxBgHeight;
                
                if (bgAspectRatio > availableRatio) {
                    bgWidth = maxBgWidth;
                    bgHeight = maxBgWidth / bgAspectRatio;
                } else {
                    bgHeight = maxBgHeight;
                    bgWidth = maxBgHeight * bgAspectRatio;
                }
                
                const bgX = (210 - bgWidth) / 2;
                const bgY = (297 - bgHeight) / 2;
                
                pdf.addImage(logoData.fondo, 'PNG', bgX, bgY, bgWidth, bgHeight);
            }
            
            // Header repetido
            this._drawPageTopHeader(pdf, logoData, 25);
            let currentY = this._drawInfoHeader(pdf, formData, 45);
            currentY += 10;
            
            // Título de la sección
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('SUPPORT IMAGES', 105, currentY, { align: 'center' });
            currentY += 15;
            
            // Procesar imágenes de esta página
            const startIndex = pageIndex * imagesPerPage;
            const endIndex = Math.min(startIndex + imagesPerPage, imageData.length);
            const pageImages = imageData.slice(startIndex, endIndex);
            
            console.log(`🖼️ Procesando imágenes ${startIndex + 1} a ${endIndex} en esta página`);
            
            // Crear tabla de imágenes usando AutoTable
            currentY = this.createImageTable(pdf, pageImages, startIndex, currentY);
            
            // Footer
            this._drawFooter(pdf, pdf.internal.getCurrentPageInfo().pageNumber);
        }
        
        console.log('✅ Páginas de imágenes generadas exitosamente');
    }

    createImageTable(pdf, images, startIndex, startY) {
        console.log(`🔧 Creando tabla de imágenes desde Y=${startY}`);
        
        if (!images || images.length === 0) {
            console.warn('⚠️ No hay imágenes para crear tabla');
            return startY;
        }

        const tableData = [];
        const imageWidth = 70; // mm
        const imageHeight = 50; // mm
        
        images.forEach((imgData, index) => {
            const globalIndex = startIndex + index;
            
            console.log(`🖼️ Preparando imagen ${globalIndex + 1}: ${imgData.name}`);
            
            // Preparar datos para la tabla
            tableData.push([
                `IMG_${globalIndex}`, // Placeholder para imagen
                `Imagen ${globalIndex + 1}:\n${imgData.description || imgData.name}`
            ]);
        });

        const self = this;
        let finalY = startY;

        pdf.autoTable({
            body: tableData,
            startY: startY,
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { 
                    cellWidth: imageWidth + 10, // Un poco más ancho para padding (80mm)
                    halign: 'center',
                    valign: 'middle'
                },
                1: { 
                    cellWidth: 105, // Resto del espacio para descripción
                    valign: 'top',
                    halign: 'left'
                }
            },
            styles: {
                minCellHeight: imageHeight + 5, // Altura mínima para acomodar imagen
                fontSize: 9,
                cellPadding: 5,
                overflow: 'linebreak',
                lineColor: [204, 204, 204],
                lineWidth: 0.3
            },
            headStyles: {
                fillColor: [255, 255, 255] // Sin header visible
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0]
            },
            didDrawCell: function(data) {
                // Solo dibujar imagen en la primera columna
                if (data.column.index === 0 && data.row.index < images.length) {
                    const imgData = images[data.row.index];
                    const globalIndex = startIndex + data.row.index;
                    
                    console.log(`🎨 Dibujando imagen ${globalIndex + 1} en celda`);
                    
                    if (imgData.src && imgData.src.startsWith('data:image/')) {
                        try {
                            // Calcular posición centrada en la celda
                            const cellCenterX = data.cell.x + (data.cell.width / 2);
                            const cellCenterY = data.cell.y + (data.cell.height / 2);
                            
                            const imgX = cellCenterX - (imageWidth / 2);
                            const imgY = cellCenterY - (imageHeight / 2);
                            
                            // Detectar formato de imagen desde el Data URL
                            let imageFormat = 'JPEG'; // Por defecto
                            if (imgData.src.startsWith('data:image/png')) {
                                imageFormat = 'PNG';
                            } else if (imgData.src.startsWith('data:image/gif')) {
                                imageFormat = 'GIF';
                            } else if (imgData.src.startsWith('data:image/webp')) {
                                imageFormat = 'WEBP';
                            }
                            
                            // Dibujar imagen
                            pdf.addImage(
                                imgData.src, 
                                imageFormat, 
                                imgX, 
                                imgY, 
                                imageWidth, 
                                imageHeight,
                                undefined,
                                'FAST'
                            );
                            
                            console.log(`✅ Imagen ${globalIndex + 1} dibujada en posición (${imgX}, ${imgY})`);
                            
                        } catch (error) {
                            console.error(`❌ Error dibujando imagen ${globalIndex + 1}:`, error);
                            
                            // Dibujar placeholder en caso de error
                            self.drawImagePlaceholder(pdf, data.cell.x + 5, data.cell.y + 5, imageWidth, imageHeight, `IMG ${globalIndex + 1}`);
                        }
                    } else {
                        console.warn(`⚠️ Imagen ${globalIndex + 1} no tiene src válido`);
                        
                        // Dibujar placeholder
                        self.drawImagePlaceholder(pdf, data.cell.x + 5, data.cell.y + 5, imageWidth, imageHeight, `IMG ${globalIndex + 1}`);
                    }
                }
            },
            didDrawPage: function(data) {
                finalY = data.cursor.y;
            }
        });
        
        console.log(`✅ Tabla de imágenes creada, Y final: ${finalY}`);
        return finalY;
    }

    drawImagePlaceholder(pdf, x, y, width, height, text) {
        // Dibujar rectángulo placeholder
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(245, 245, 245);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, width, height, 'FD');
        
        // Dibujar texto centrado
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        
        const textX = x + (width / 2);
        const textY = y + (height / 2);
        
        pdf.text(text, textX, textY, { align: 'center' });
        pdf.text('IMAGE', textX, textY + 4, { align: 'center' });
        pdf.text('PLACEHOLDER', textX, textY + 8, { align: 'center' });
    }

    _showSuccess(filename) {
        const div = document.createElement('div');
        div.textContent = `✅ PDF ${filename} generado exitosamente`;
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:#fff;padding:15px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:600;max-width:400px;';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }

    _showError(msg) {
        const div = document.createElement('div');
        div.textContent = `❌ Error PDF: ${msg}`;
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#e74c3c;color:#fff;padding:15px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-weight:600;max-width:400px;word-wrap:break-word;';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 6000);
    }

    drawLogoPlaceholder(pdf) {
        // Logo superior derecho placeholder
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(165, 20, 30, 15);
        pdf.setFontSize(6);
        pdf.setTextColor(0, 0, 0);
        pdf.text('VIVA LOGO', 175, 29, { align: 'center' });
        
        // Logo de fondo placeholder (centrado verticalmente)
        pdf.setFontSize(120);
        pdf.setTextColor(0, 0, 0);
        pdf.text('VIVA', 105, 160, { align: 'center' }); // Ajustado para centrado vertical
    }

    _drawInfoHeader(pdf, formData, startY = 45) {
        const tableWidth = 180;
        const colWidth = tableWidth / 4;
        const rowHeight = 6;
        let y = startY;

        // Primera fila de headers
        const headers1 = ['Work Order Number', 'A/C Registration', 'Engine S/N', 'Inspected By'];
        pdf.setDrawColor(204, 204, 204);
        headers1.forEach((header, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(242, 242, 242);
            pdf.rect(x, y, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(header, x + 2, y + 4);
        });
        y += rowHeight;

        // Datos primera fila
        const data1 = [
            formData.work_order_number || '[Work Order Number]',
            formData.aircraft_registration || '[A/C Registration]',
            formData.engine_sn || '[Engine S/N]',
            formData.inspected_by || '[Inspected By]'
        ];
        data1.forEach((value, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, y, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, x + 2, y + 4);
        });
        y += rowHeight;

        // Segunda fila de headers
        const headers2 = ['Internal ID', 'A/C Model', 'Station', 'Inspection Date'];
        headers2.forEach((header, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(242, 242, 242);
            pdf.rect(x, y, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(header, x + 2, y + 4);
        });
        y += rowHeight;

        // Datos segunda fila
        const data2 = [
            formData.nombre_registrado || '[Internal ID]',
            formData.aircraft_model || '[A/C Model]',
            formData.station || '[Station]',
            formData.date_of_bsi || '[Inspection Date]'
        ];
        data2.forEach((value, i) => {
            const x = 15 + (i * colWidth);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, y, colWidth, rowHeight, 'FD');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, x + 2, y + 4);
        });
        y += rowHeight + 8;

        // References Used
        pdf.setFillColor(242, 242, 242);
        pdf.rect(15, y, colWidth, rowHeight, 'FD');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('References Used', 17, y + 4);

        pdf.setFillColor(255, 255, 255);
        pdf.rect(15 + colWidth, y, tableWidth - colWidth, rowHeight, 'FD');
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const referencesText = formData.references_used || '[References Used]';
        pdf.text(referencesText, 17 + colWidth, y + 4);

        return y + rowHeight; // Devuelve Y final por si se necesita
    }

    _drawFooter(pdf, pageNum) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('F-QC-018 REV 3 (05-OCT-2021)', 15, 275);
        pdf.text(`Page ${pageNum}`, 15, 285);
        pdf.text('Aeroenlaces Nacionales S.A de C.V', 200, 275, { align: 'right' });
        pdf.text('DGAC 348', 200, 285, { align: 'right' });
    }

    _drawPageTopHeader(pdf, logoData, yText = 25) {
        // Texto de cabecera
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('QUALITY CONTROL DEPARTMENT', 105, yText, { align: 'center' });
        pdf.text('BOROSCOPE INSPECTION REPORT', 105, yText + 8, { align: 'center' });

        // Logo superior derecho
        if (logoData && logoData.loaded) {
            const aspectRatio = logoData.width / logoData.height;
            const maxHeight = 15;
            const proportionalWidth = Math.min(maxHeight * aspectRatio, 35);
            const finalHeight = proportionalWidth / aspectRatio;
            const logoX = 200 - proportionalWidth - 5;
            pdf.addImage(logoData.normal, 'PNG', logoX, yText - 10, proportionalWidth, finalHeight);
        }
    }
}

window.PdfManager = PdfManager; 

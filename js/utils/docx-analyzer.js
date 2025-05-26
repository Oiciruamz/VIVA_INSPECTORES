const fs = require('fs-extra');
const path = require('path');
const PizZip = require('pizzip');

class DocxAnalyzer {
    constructor() {}

    async extractVariables(docxPath) {
        try {
            console.log(`Analizando archivo: ${docxPath}`);
            
            // Leer el archivo .docx
            const content = await fs.readFile(docxPath);
            const zip = new PizZip(content);
            
            // Extraer el contenido XML del documento
            const documentXml = zip.files['word/document.xml'];
            if (!documentXml) {
                throw new Error('No se pudo encontrar word/document.xml en el archivo');
            }
            
            const xmlContent = documentXml.asText();
            
            // Buscar variables en diferentes formatos
            const variables = new Set();
            const textContent = this.extractTextContent(xmlContent);
            
            // Buscar variables en formato {variable}
            const bracketMatches = xmlContent.match(/\{[^}]+\}/g);
            if (bracketMatches) {
                bracketMatches.forEach(match => {
                    const variable = match.slice(1, -1); // Remover { y }
                    if (variable.trim() && !this.isGuid(variable.trim())) {
                        variables.add(variable.trim());
                    }
                });
            }
            
            // Buscar merge fields de Word
            const mergeFieldMatches = xmlContent.match(/<w:fldSimple[^>]*w:instr="[^"]*MERGEFIELD\s+([^"\\]+)[^"]*"[^>]*>/g);
            if (mergeFieldMatches) {
                mergeFieldMatches.forEach(match => {
                    const fieldMatch = match.match(/MERGEFIELD\s+([^\s\\]+)/);
                    if (fieldMatch && fieldMatch[1]) {
                        variables.add(fieldMatch[1].trim());
                    }
                });
            }
            
            // Buscar campos complejos de merge field
            const complexFieldMatches = xmlContent.match(/<w:instrText[^>]*>.*?MERGEFIELD\s+([^<\s\\]+).*?<\/w:instrText>/g);
            if (complexFieldMatches) {
                complexFieldMatches.forEach(match => {
                    const fieldMatch = match.match(/MERGEFIELD\s+([^\s\\<]+)/);
                    if (fieldMatch && fieldMatch[1]) {
                        variables.add(fieldMatch[1].trim());
                    }
                });
            }
            
            // Buscar texto que podría ser marcadores de posición
            const placeholderMatches = textContent.match(/\[([^\]]+)\]/g);
            if (placeholderMatches) {
                placeholderMatches.forEach(match => {
                    const variable = match.slice(1, -1); // Remover [ y ]
                    if (variable.trim() && !this.isGuid(variable.trim())) {
                        variables.add(variable.trim());
                    }
                });
            }
            
            // Convertir Set a Array y ordenar
            const variablesList = Array.from(variables).sort();
            
            return {
                filePath: docxPath,
                totalVariables: variablesList.length,
                variables: variablesList,
                textContent: textContent,
                xmlContent: xmlContent // Para debugging si es necesario
            };
            
        } catch (error) {
            console.error('Error analizando archivo .docx:', error);
            throw error;
        }
    }

    extractTextContent(xmlContent) {
        // Extraer solo el texto del XML, removiendo las etiquetas
        let text = xmlContent.replace(/<[^>]*>/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        return text;
    }

    isGuid(str) {
        // Verificar si es un GUID/UUID
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(str);
    }

    async analyzeTemplate(templateName) {
        const templatePath = path.join(__dirname, '../../plantilla_word', templateName);
        
        if (!await fs.pathExists(templatePath)) {
            throw new Error(`No se encontró la plantilla: ${templatePath}`);
        }
        
        return await this.extractVariables(templatePath);
    }

    printVariablesReport(analysis) {
        console.log('\n' + '='.repeat(60));
        console.log(`ANÁLISIS DE PLANTILLA: ${path.basename(analysis.filePath)}`);
        console.log('='.repeat(60));
        console.log(`Total de variables encontradas: ${analysis.totalVariables}`);
        
        // Mostrar una muestra del contenido de texto
        console.log('\nMuestra del contenido del documento:');
        console.log('-'.repeat(40));
        const textSample = analysis.textContent.substring(0, 500);
        console.log(textSample + (analysis.textContent.length > 500 ? '...' : ''));
        
        console.log('\nVariables encontradas:');
        console.log('-'.repeat(40));
        
        if (analysis.variables.length === 0) {
            console.log('No se encontraron variables en la plantilla.');
            console.log('\nFormatos soportados:');
            console.log('- {nombre_variable}');
            console.log('- [nombre_variable]');
            console.log('- MERGEFIELD nombre_variable');
            console.log('\nRECOMENDACIÓN:');
            console.log('La plantilla necesita ser preparada con marcadores de variables.');
            console.log('Puedes usar el modo desarrollador de Word para insertar campos de combinación');
            console.log('o simplemente escribir marcadores como {work_order_number}, {date_of_bsi}, etc.');
        } else {
            analysis.variables.forEach((variable, index) => {
                console.log(`${(index + 1).toString().padStart(3)}. {${variable}}`);
            });
            
            console.log('\n' + '-'.repeat(40));
            console.log('Para usar estas variables en el código JavaScript:');
            console.log('-'.repeat(40));
            analysis.variables.forEach(variable => {
                console.log(`${variable}: formData.${variable} || '',`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
    }

    async generateMappingCode(templateName) {
        const analysis = await this.analyzeTemplate(templateName);
        
        if (analysis.variables.length > 0) {
            console.log('\n// Código JavaScript para mapear las variables:');
            console.log('const processedData = {');
            
            analysis.variables.forEach(variable => {
                console.log(`    ${variable}: formData.${variable} || '',`);
            });
            
            console.log('};');
        } else {
            console.log('\n// No se encontraron variables para mapear.');
            console.log('// Necesitas preparar la plantilla con marcadores como:');
            console.log('// {work_order_number}, {date_of_bsi}, {inspected_by}, etc.');
        }
        
        return analysis;
    }

    generateSuggestedVariables() {
        console.log('\n' + '='.repeat(60));
        console.log('VARIABLES SUGERIDAS PARA EL FORMULARIO BSI PW1100:');
        console.log('='.repeat(60));
        
        const suggestedVariables = [
            // Información general
            'nombre_registrado',
            'work_order_number',
            'date_of_bsi',
            'inspected_by',
            'inspector_stamp',
            'station',
            'bsi_reason',
            'bsi_type',
            'references_used',
            
            // Información de aeronave
            'aircraft_model',
            'aircraft_registration',
            'engine_sn',
            
            // Equipo utilizado
            'boroscope_type',
            'boroscope_sn',
            'probe_sn',
            
            // Secciones de componentes (ejemplos)
            'lpc_stage1_status',
            'lpc_stage1_remarks',
            'lpc_stage2_status',
            'lpc_stage2_remarks',
            'lpc_stage3_status',
            'lpc_stage3_remarks',
            
            // Disposición final
            'final_disposition',
            'engine_status_bsi',
            'new_interval_inspections',
            'user_email',
            'inspection_time',
            'generation_date'
        ];
        
        console.log('Agrega estos marcadores a tu plantilla Word:');
        console.log('-'.repeat(40));
        
        suggestedVariables.forEach((variable, index) => {
            console.log(`${(index + 1).toString().padStart(3)}. {${variable}}`);
        });
        
        console.log('\n' + '-'.repeat(40));
        console.log('INSTRUCCIONES PARA PREPARAR LA PLANTILLA:');
        console.log('-'.repeat(40));
        console.log('1. Abre BSI_PW1100.docx en Microsoft Word');
        console.log('2. Coloca el cursor donde quieras insertar un dato');
        console.log('3. Escribe el marcador, por ejemplo: {work_order_number}');
        console.log('4. Repite para todos los campos que necesites');
        console.log('5. Guarda el archivo');
        console.log('\nAlternativamente, puedes usar:');
        console.log('- Insertar > Texto rápido > Campo > Combinar correspondencia > MergeField');
        console.log('- O simplemente escribir los marcadores manualmente con llaves {}');
        
        return suggestedVariables;
    }
}

module.exports = DocxAnalyzer; 
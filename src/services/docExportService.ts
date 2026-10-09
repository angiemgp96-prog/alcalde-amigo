import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from 'docx';

export interface DocxExportOptions {
  tituloPrincipal: string;
  subtitulo?: string;
  entidadEmisora: string;
  tipoDocumento: 'licitacion_secop' | 'proyecto_mga';
  referenciaProceso?: string;
  contenidoTexto: string;
  firmantes?: {
    cargo: string;
    entidad: string;
    nombre?: string;
    documento?: string;
  }[];
}

/**
 * Convierte texto estructurado en un documento Word (.docx) formal de alta calidad institucional
 */
export async function generateOfficialDocxBlob(options: DocxExportOptions): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  const isLicitacion = options.tipoDocumento === 'licitacion_secop';
  const colorPrimario = isLicitacion ? '1E1B4B' : '0F172A'; // Azul/Indigo institucional

  // 1. ENCABEZADO FORMAL
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: options.entidadEmisora.toUpperCase(),
          bold: true,
          size: 26, // 13pt
          color: colorPrimario,
          font: 'Calibri'
        })
      ]
    })
  );

  if (options.subtitulo) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: options.subtitulo.toUpperCase(),
            bold: true,
            size: 20, // 10pt
            color: '475569',
            font: 'Calibri'
          })
        ]
      })
    );
  }

  // 2. REFERENCIA Y PROCESO
  if (options.referenciaProceso) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `EXPEDIENTE / PROCESO: ${options.referenciaProceso}`,
            bold: true,
            size: 18, // 9pt
            color: '0369A1',
            font: 'Calibri'
          })
        ]
      })
    );
  }

  // 3. TÍTULO DEL DOCUMENTO
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: options.tituloPrincipal.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          color: colorPrimario,
          font: 'Calibri'
        })
      ]
    })
  );

  // 4. CUERPO DEL DOCUMENTO (SEPARADO EN PÁRRAFOS REALES)
  const lineas = options.contenidoTexto.split('\n');
  for (const linea of lineas) {
    const trimmed = linea.trim();
    if (!trimmed) {
      // Línea en blanco para espaciado
      paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    // Detectar si la línea es un subtítulo o cláusula en mayúsculas
    const esTituloSeccion = trimmed.match(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|CAPÍTULO|CLÁUSULA|FASE|1\.|2\.|3\.|4\.|ASUNTO:|OBJETO:|CONSIDERANDO|HACE CONSTAR:)/i) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && trimmed.length < 60);

    if (esTituloSeccion) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 22, // 11pt
              color: '1E293B',
              font: 'Calibri'
            })
          ]
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140, line: 280 }, // Interlineado 1.15
          children: [
            new TextRun({
              text: trimmed,
              size: 21, // 10.5pt
              color: '334155',
              font: 'Calibri'
            })
          ]
        })
      );
    }
  }

  // 5. BLOQUE FORMAL DE FIRMAS
  paragraphs.push(
    new Paragraph({
      spacing: { before: 500, after: 200 },
      children: [
        new TextRun({
          text: 'SUSCRIPCIÓN Y CONSTANCIA FORMAL:',
          bold: true,
          size: 18,
          color: '64748B',
          font: 'Calibri'
        })
      ]
    })
  );

  const firmantes = options.firmantes || [
    {
      cargo: isLicitacion ? 'REPRESENTANTE LEGAL' : 'SECRETARIO DE PLANEACIÓN MUNICIPAL',
      entidad: options.entidadEmisora,
      nombre: isLicitacion ? 'Representante Legal Autorizado' : 'Despacho de Planeación y Gestión Territorial'
    }
  ];

  for (const firmante of firmantes) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 350, after: 40 },
        children: [
          new TextRun({
            text: '___________________________________________________________',
            bold: true,
            color: '94A3B8'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: firmante.cargo.toUpperCase(),
            bold: true,
            size: 20,
            color: '1E293B',
            font: 'Calibri'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: firmante.entidad,
            size: 18,
            color: '64748B',
            font: 'Calibri'
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 pulgada (2.54 cm)
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: paragraphs
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Dispara la descarga de un archivo Blob en el navegador con el nombre especificado
 */
export function downloadFileBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

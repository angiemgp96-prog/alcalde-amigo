# 🌿 ALCALDE AMIGO con "Ramitos"
> **Plataforma Inteligente de Co-Creación Ciudadana, CRM Comunitario y Plan de Gobierno Resolutivo**
> *Enfocada en Guaduas, Cundinamarca — Cero Burocracia, Soluciones Reales e Inmediatas.*

---

## 🚀 Características Principales

1. **Escucha Activa con "Ramitos" (Micrófono Abierto & Texto)**:
   - Captura por voz utilizando la `Web Speech API` del navegador.
   - Transcripción instantánea y ecualizador visual de onda de audio en vivo.
   - Formulario de captura de datos de contacto para **WhatsApp / Telegram (Green API)**.

2. **Sintetizador & Motor Resolutivo estilo Candidato**:
   - Transforma testimonios en necesidades redactadas con precisión.
   - Genera soluciones prácticas inmediatas (ej. **Motobomba + EcoFlow en Piedras Negras**, **Filtros de cobre en Puerto Bogotá**, **Starlink en escuelas veredales**, **Red de Parques Infantiles Dignos**, **La Ruta Campesina**).

3. **Plan de Gobierno Base Precargado (Guaduas)**:
   - Proyectos organizados por sectores cívicos.
   - Manifiesto comparativo: *Políticos anticuados (megaobras irrealizables) vs Método Ramitos (obras reales que transforman hoy)*.

4. **CRM Comunitario Green API (WhatsApp / Telegram)**:
   - Panel para envíos masivos por vereda o tema.
   - Generador de plantillas dinámicas y seguimiento de estado.

5. **Copiloto de Ejecución Alcaldía**:
   - Fichas técnicas con presupuesto estimado en **$ COP**.
   - Marco Legal Colombiano (**Ley 80 / Convenios Solidarios con JAC Ley 2166**).
   - Talento Humano requerido y Cronograma acelerado.

---

## 🛠️ Desarrollo Local (Localhost)

La aplicación funciona 100% de manera autónoma en local utilizando **LocalStorage como fallback** sin necesidad de configurar base de datos desde el primer segundo.

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## ☁️ Publicación Online Gratuita (Render + Supabase)

### 1. Base de Datos Gratuita en Supabase
1. Crea un proyecto en [Supabase.com](https://supabase.com) (Plan Gratuito).
2. Ve al **SQL Editor** en tu panel de Supabase.
3. Copia y pega el contenido del archivo `supabase/schema.sql` y haz clic en **Run**.
4. En **Project Settings -> API**, copia tu `URL` y la `anon public key`.
5. Pégalas en el panel **Consola Cloud** dentro de la app o en tu archivo `.env`.

### 2. Hosting Gratuito en Render
1. Sube tu código a GitHub.
2. Ve a [Render.com](https://render.com) -> **New Static Site**.
3. Conecta tu repositorio.
4. Render detectará automáticamente el archivo `render.yaml`:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `./dist`
5. Haz clic en **Create Static Site**. ¡Tu app estará online con SSL gratis!

---

## 📱 Configuración Green API (WhatsApp Masivo)
1. Regístrate gratis en [Green API](https://green-api.com).
2. Crea una instancia gratuita y escanea el código QR desde tu celular.
3. Copia tu `idInstance` y `apiTokenInstance`.
4. Configúralas en la sección **CRM Green API** dentro de la app para realizar envíos comunitarios reales a la ciudadanía.

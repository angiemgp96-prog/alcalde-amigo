====================================================================
🌿 GUÍA DE ASSETS Y ANIMACIONES PARA EL PERSONAJE RAMITOS
====================================================================

¡Bienvenido! Aquí puedes agregar tus propias animaciones o imágenes
del personaje "Ramitos" para que la aplicación las utilice automáticamente.

--------------------------------------------------------------------
1. FORMATOS SOPORTADOS Y NOMBRES DE ARCHIVO
--------------------------------------------------------------------
Puedes colocar archivos animaciones GIF, PNG transparentes, WebM o Lottie JSON
con los siguientes nombres según las 9 expresiones del personaje:

  - ramitos_feliz.gif       (o .png / .webm / .json)
  - ramitos_curioso.gif     (o .png / .webm / .json)
  - ramitos_pensativo.gif   (o .png / .webm / .json)
  - ramitos_entusiasmado.gif(o .png / .webm / .json)
  - ramitos_triste.gif      (o .png / .webm / .json)
  - ramitos_sorprendido.gif (o .png / .webm / .json)
  - ramitos_enojado.gif     (o .png / .webm / .json)
  - ramitos_confundido.gif  (o .png / .webm / .json)
  - ramitos_agradecido.gif  (o .png / .webm / .json)

--------------------------------------------------------------------
2. RECOMENDACIONES TÉCNICAS
--------------------------------------------------------------------
- Fondo: Transparente (PNG, GIF o WebM transparente).
- Aspect Ratio: Cuadrado 1:1 (Ejemplo: 512x512px o 1024x1024px).
- Estilo del personaje:
    * Cabeza en forma de nube negra con borde blanco reluciente.
    * Tallo/tronco blanco en la base.
    * 2 Hojitas verdes abiertas a los lados como manos (🤲).
    * Ramos de flores digitales neón floreciendo arriba/atrás.
    * Carita con ojos y boca amigables según la expresión.

--------------------------------------------------------------------
3. ¿CÓMO FUNCIONA EN LA APP?
--------------------------------------------------------------------
La aplicación detectará si existe el archivo en esta carpeta (`/assets/ramitos/ramitos_[expresion].gif` o `.png`).
Si el archivo existe, mostrará tu animación real.
Si aún no has subido el archivo, la app usará automáticamente el personaje vectorial SVG dinámico como fallback.

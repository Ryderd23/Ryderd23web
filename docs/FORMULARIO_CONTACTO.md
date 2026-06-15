# Formulario de contacto (Web3Forms)

Los mensajes del sitio se envían con **[Web3Forms](https://web3forms.com)** (API HTTPS, compatible con sitios Astro **estáticos** sin backend propio).

## Correo de destino

En el panel de Web3Forms, al crear la clave de acceso, indica el correo donde quieres recibir los envíos (por ejemplo **maikel.eb23@gmail.com**). Ese correo **no** va en el código: lo define la cuenta Web3Forms vinculada a tu `access_key`.

## Variable de entorno

1. Copia `.env.example` a `.env` en la raíz del proyecto (si aún no existe).
2. Rellena:

   ```env
   PUBLIC_WEB3FORMS_ACCESS_KEY=tu_clave_aquí
   ```

3. Reinicia el servidor de desarrollo (`pnpm dev`) tras cambiar `.env`.

**Producción:** en Vercel, Netlify, Cloudflare Pages, etc., añade la misma variable `PUBLIC_WEB3FORMS_ACCESS_KEY` en la sección de Environment Variables del proyecto y vuelve a desplegar.

## Comportamiento

- El botón muestra estado **Enviando…** con spinner mientras dura la petición.
- **Éxito:** mensaje en dorado y el formulario se limpia.
- **Error:** mensaje en rojo suave con el detalle cuando la API lo devuelve.

Si falta la clave, el usuario verá un mensaje indicando configurar `.env` (útil en local antes de desplegar).

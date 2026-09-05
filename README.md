# Invitación XV Matilda

Sitio web estático que funciona como invitación digital. Cada grupo familiar recibe un
link único con sus nombres; al tocar el sobre se revela la invitación con los detalles del evento.

## Estructura

- `index.html` — las dos pantallas (sobre e invitación).
- `css/style.css` — estilos y animación de apertura del sobre.
- `js/guests.js` — lista de grupos familiares invitados (editar acá para agregar/quitar invitados).
- `js/config.js` — datos del evento (fecha, hora, lugar, dress code, link de Google Forms para RSVP, foto).
- `js/main.js` — lógica: lee el link, busca el grupo, muestra los nombres y maneja la animación.
- `images/` — poné acá las fotos/imágenes reales (reemplazá el placeholder).

## Cómo agregar o editar invitados

Editá `js/guests.js`. Cada grupo necesita un `slug` único (sin espacios ni tildes, se usa en la URL)
y un array `names` con los nombres:

```js
{
  slug: "martin-lucas-andrea",
  names: ["Martin", "Lucas", "Andrea"],
}
```

El link para ese grupo queda: `https://tu-sitio.github.io/XV-Matilda/?g=martin-lucas-andrea`

## Cómo completar los datos del evento

Editá `js/config.js`: fecha, hora, lugar, dirección, dress code y el link real del Google Forms de
confirmación de asistencia (`rsvpFormUrl`).

## Cómo probarlo localmente

Abrí `index.html` con un servidor local (necesario para que `fetch`/módulos funcionen bien en
algunos navegadores; en este caso alcanza con abrir el archivo directo o con un server simple):

```bash
python3 -m http.server 8000
```

Después entrá a `http://localhost:8000/?g=ailen-carlos-laura`.

## Publicar en GitHub Pages

1. En GitHub, andá a **Settings → Pages**.
2. En "Build and deployment", elegí **Deploy from a branch**.
3. Seleccioná la rama correspondiente y la carpeta `/ (root)`.
4. Guardá. El sitio va a quedar publicado en `https://<usuario>.github.io/<repo>/`.
5. Compartí con cada familia su link con el `?g=slug` correspondiente.

## Pendiente / próximos pasos

- Reemplazar el placeholder de foto en `images/` por la foto real.
- Reemplazar el sobre/textura hechos con CSS por las imágenes reales de diseño, si se quiere
  el look exacto de las artes originales (encaje, sello de cera fotográfico, etc.).
- Cargar la lista completa de invitados en `js/guests.js`.
- Completar `js/config.js` con los datos reales del evento y el link del Google Forms.

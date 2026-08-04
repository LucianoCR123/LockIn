# LockIn (beta)

App de accountability para un grupo de amigos: pasos diarios, gimnasio,
dieta, "shit meals/days", mensajes de aliento, calendario semana/mes, país y
huso horario de cada quien, y un puntaje semanal por grupo. Se ve y se usa
como una app de celular (podés agregarla a la pantalla de inicio).

## Producción (link real)

- App: https://lock-in-delta.vercel.app
- API: https://lockin-5e2u.onrender.com
- Repo: https://github.com/LucianoCR123/LockIn
- Base de datos: Postgres en Neon (gratis)

El backend en Render (plan gratis) "duerme" tras ~15 min sin uso — la primera
carga del día puede tardar 30-50s en responder mientras despierta, es normal.

Cada `git push` a `main` en GitHub despliega solo (Render y Vercel están
conectados al repo).

## Requisitos

Node.js ya está instalado en `~/.local/node` y agregado al PATH en
`~/.zshrc` (abre una terminal nueva, o corre `source ~/.zshrc`, para que
`node`/`npm` estén disponibles).

## Cómo correrlo

Backend (API en `http://localhost:4001`; se usa ese puerto y no el 4000 para
no chocar con `rating-app`, que ya lo ocupa):

```bash
cd server
npm install
npm run dev                # arranca con auto-reload (usa la base Postgres de Neon)
```

Frontend (en `http://localhost:5173`):

```bash
cd client
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador para probarlo en la Mac. Si ese
puerto (o el 4000 del backend) ya está ocupado por otro proyecto (como
`rating-app`), Vite y Express avisan en la terminal qué puerto usaron en su
lugar — usa ese.

## Abrirlo desde el celular (misma WiFi)

1. Con ambos servidores corriendo, busca la IP de tu Mac en la red WiFi
   (Preferencias del Sistema → Wi-Fi → Detalles, o `ipconfig getifaddr en0`
   en la terminal). Ejemplo: `10.0.0.55`.
2. En el celular (misma WiFi que la Mac), abre
   `http://10.0.0.55:5173` en Safari o Chrome.
3. Toca "Compartir" → "Agregar a pantalla de inicio" (iPhone) o el menú →
   "Instalar app" / "Agregar a pantalla de inicio" (Android).
4. Ábrela desde el ícono que quedó en tu pantalla de inicio — abre sin la
   barra del navegador, como una app.

**Importante:** esto solo funciona mientras la Mac esté prendida, corriendo
`npm run dev`, y el celular esté en la misma red WiFi. Para que tus amigos la
usen desde cualquier lugar (no solo en tu WiFi), el siguiente paso es
desplegarla a un hosting real — avísame cuando quieran dar ese paso.

## Primer uso

1. Uno del grupo se registra y crea el grupo, definiendo las reglas (pasos
   mínimos por día, entrenamientos mínimos por semana, shit meals/días
   permitidos).
2. Comparte el **código de invitación** de 6 caracteres (visible en la
   pestaña "Grupo") con el resto.
3. Cada amigo se registra, entra el código en "Unirme a un grupo", revisa las
   reglas, y toca "Acepto las reglas y me uno".
4. Cada día: pestaña "Hoy" para registrar pasos, gym, dieta (o shit
   meal/day), y mandar mensajes de aliento. Pestaña "Grupo" para ver el
   ranking semanal y la racha de cada quien. Pestaña "Perfil" para ver tus
   grupos, unirte a otro grupo con tus mismos datos, o crear uno nuevo.

## Notas técnicas

- Backend: Express + Prisma + Postgres (Neon), auth con JWT en cookie
  httpOnly (`sameSite: "none"` + `secure` en producción, porque frontend y
  backend viven en dominios distintos).
- Frontend: React + Vite. `client/src/api.js` usa el mismo host con el que se
  cargó la página, por eso funciona igual en `localhost` y en la IP LAN.
- El registro de pasos/gimnasio/dieta (`DailyLog`) es **por usuario y por
  día**, compartido entre todos los grupos a los que pertenezcas — cada grupo
  solo aplica sus propias reglas sobre esos mismos datos para calcular tu
  puntaje y racha en ese grupo.
- Ingreso de pasos/entrenamientos es manual por ahora. Apple Health/HealthKit
  solo se puede leer desde una app nativa de iOS (no desde web/PWA), así que
  queda fuera de esta beta.
- PWA: `client/public/manifest.json` + meta tags en `index.html` para que
  "Agregar a pantalla de inicio" abra en modo standalone (sin barra de
  navegador).

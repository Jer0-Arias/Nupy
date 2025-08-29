📂 Estructura del proyecto

.expo/
Configuración interna de Expo (no lo toques normalmente).

.vscode/
Configuración de tu editor VS Code (atajos, settings, debug).

app/
Generalmente aquí están las pantallas o la navegación principal.

Puede tener subcarpetas como screens/, navigation/.

Expo ahora usa expo-router, y en ese caso las pantallas se crean como archivos dentro de app/.

assets/
Imágenes, íconos, fuentes, audios, etc.

components/
Componentes reutilizables (botones, tarjetas, inputs, headers).

constants/
Archivos con constantes globales: colores, tamaños de fuente, rutas de API, etc.

hooks/
Custom hooks de React, por ejemplo useAuth, useFetch, etc.

Layouts/
Layouts generales de la app. Ejemplo: un layout que envuelve todas las pantallas con el mismo header/footer.

scripts/
Scripts auxiliares (build, deploy, limpieza, automatización).

node_modules/
Dependencias instaladas (no se toca).

.gitignore → Ignora carpetas/archivos en Git.

app.json → Configuración de Expo (nombre de la app, ícono, splash, etc).

eslint.config.js → Reglas de linting (estilo de código).

expo-env.d.ts → Tipado de Expo (TypeScript).

package.json / package-lock.json → Dependencias y scripts.

README.md → Documentación del proyecto.

tsconfig.json → Configuración de TypeScript.




### Objetivo

Diseñar una arquitectura **clara, escalable y fácil de mantener** para tu app de **React Native + Expo (TypeScript)**, apoyada en **feature-first** + principios de **Clean Architecture (Presentación / Dominio / Datos)**.

---

## Principios

* **Feature-first**: cada módulo (auth, usuarios, productos, etc.) vive aislado.
* **Capas**:

  * **Presentación (UI)**: componentes, pantallas, navegación (expo-router).
  * **Dominio**: tipos/schemas, casos de uso, reglas de negocio puras.
  * **Datos**: llamadas HTTP, almacenamiento local, mapeo API ⇄ dominio.
* **Single Source of Truth**: store por feature (Zustand) + cache remota (React Query).
* **Tipado fuerte** (TypeScript) + **validación** (Zod).
* **Separation of Concerns**: UI no conoce Axios; habla con hooks/casos de uso.

---

## Librerías recomendadas

* **Navegación**: `expo-router` (ya viene con Expo SDK 50+).
* **Estado local por feature**: `zustand`.
* **Server state / cache**: `@tanstack/react-query`.
* **HTTP**: `axios`.
* **Validación**: `zod`.
* **Estilos**: `nativewind` (Tailwind para RN) — opcional pero recomendado.
* **Secure storage**: `expo-secure-store` (tokens/credenciales).

**Instalación**

```bash
npm i axios zod zustand @tanstack/react-query
npx expo install expo-secure-store
# Opcional estilos tipo Tailwind
npm i nativewind
npm i -D tailwindcss
npx tailwindcss init
```

---

## Estructura de carpetas propuesta

Mantén `app/` para las rutas de **expo-router** y mueve lógica a `src/`.

```
app/                     # Rutas (expo-router)
  _layout.tsx            # Providers globales (QueryClient, Theme, etc.)
  (auth)/                # Grupo de rutas de autenticación
    login.tsx
  (tabs)/                # Grupo con pestañas
    _layout.tsx
    index.tsx

src/
  shared/                # Código común a todas las features
    libs/
      http.ts            # Axios preconfigurado
      queryClient.ts     # React Query client
    config/
      env.ts             # Acceso a variables (extra de app.json)
      theme.ts           # Colores/espacios, si usas NativeWind o StyleSheet
    services/
      storage.ts         # SecureStore wrapper
    ui/                  # Componentes UI reutilizables (Button, Card, etc.)
    utils/               # Helpers
    types/               # Tipos globales

  features/
    auth/
      domain/
        schemas.ts       # Zod schemas + tipos (User, Token, etc.)
        usecases.ts      # Casos de uso (login, logout, hydrate)
      data/
        auth.api.ts      # Llamadas HTTP (Axios)
        mappers.ts       # Mapear API ⇄ dominio (si hace falta)
      ui/
        screens/
          LoginScreen.tsx
        components/
          LoginForm.tsx
      hooks/
        useLogin.ts      # React Query mutation
      store/
        auth.store.ts    # Zustand (token, user, estado)
```

> Puedes conservar tus carpetas actuales (`components`, `hooks`, `constants`, `Layouts`) y migrarlas gradualmente a `src/shared/`.

---

## Configuración de entorno

**app.json**

```json
{
  "expo": {
    "name": "nupy",
    "slug": "nupy",
    "extra": {
      "API_URL": "http://192.168.0.10:3000"  
    }
  }
}
```

**src/shared/config/env.ts**

```ts
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { API_URL?: string } | undefined;
export const ENV = {
  API_URL: extra?.API_URL ?? 'http://localhost:3000'
};
```

---

## Providers globales (expo-router)

**app/\_layout.tsx**

```tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/shared/libs/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

**src/shared/libs/queryClient.ts**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
    mutations: { retry: 1 }
  }
});
```

---

## HTTP client y storage

**src/shared/libs/http.ts**

```ts
import axios from 'axios';
import { ENV } from '../config/env';

export const http = axios.create({ baseURL: ENV.API_URL, timeout: 20_000 });

// Aquí podrías añadir interceptores para token, logs, etc.
```

**src/shared/services/storage.ts**

```ts
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async del(key: string) {
    await SecureStore.deleteItemAsync(key);
  }
};
```

---

## Feature de ejemplo: Auth

**src/features/auth/domain/schemas.ts**

```ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  email: z.string().email()
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema
});

export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

**src/features/auth/data/auth.api.ts**

```ts
import { http } from '@/shared/libs/http';
import { loginResponseSchema, LoginResponse } from '../domain/schemas';

export type LoginDTO = { email: string; password: string };

export async function login(dto: LoginDTO): Promise<LoginResponse> {
  const { data } = await http.post('/auth/login', dto);
  return loginResponseSchema.parse(data);
}
```

**src/features/auth/store/auth.store.ts**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/shared/services/storage';
import { User } from '../domain/schemas';

interface AuthState {
  token?: string;
  user?: User;
  setAuth: (p: { token: string; user: User }) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: undefined,
      user: undefined,
      setAuth: ({ token, user }) => set({ token, user }),
      logout: async () => {
        await storage.del('token');
        set({ token: undefined, user: undefined });
      }
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => ({
        setItem: storage.set,
        getItem: storage.get,
        removeItem: storage.del
      }))
    }
  )
);
```

**src/features/auth/hooks/useLogin.ts**

```ts
import { useMutation } from '@tanstack/react-query';
import { login, LoginDTO } from '../data/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (dto: LoginDTO) => login(dto),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
    }
  });
}
```

**src/features/auth/ui/components/LoginForm.tsx**

```tsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useLogin } from '../../hooks/useLogin';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useLogin();

  return (
    <View style={{ gap: 12 }}>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, padding: 8 }} />
      {error ? <Text style={{ color: 'red' }}>{String((error as any)?.message ?? 'Error')}</Text> : null}
      <Button title={isPending ? 'Entrando…' : 'Entrar'} onPress={() => mutate({ email, password })} />
    </View>
  );
}
```

**app/(auth)/login.tsx**

```tsx
import { View, Text } from 'react-native';
import LoginForm from '@/features/auth/ui/components/LoginForm';

export default function Login() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Inicia sesión</Text>
      <LoginForm />
    </View>
  );
}
```

---

## Navegación con grupos (expo-router)

**app/(tabs)/\_layout.tsx**

```tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      {/* Otras pestañas */}
    </Tabs>
  );
}
```

**app/(tabs)/index.tsx**

```tsx
import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home</Text>
    </View>
  );
}
```

---

## Estilos con NativeWind (opcional)

**tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
};
```

Uso:

```tsx
import { Text, View } from 'react-native';

export default function Hello() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">Hola 👋</Text>
    </View>
  );
}
```

---

## Testing (rápido)

* **Unit/UI**: `jest` + `@testing-library/react-native`.
* Estructura por feature: `src/features/<feature>/__tests__/...`.

---

## Checklist de adopción (paso a paso)

1. Instala dependencias (Axios, React Query, Zustand, Zod, SecureStore, NativeWind opcional).
2. Crea `src/` con `shared/` y `features/` como en el árbol.
3. Añade `ENV` en `app.json` y `src/shared/config/env.ts`.
4. Crea `http.ts`, `queryClient.ts` y `storage.ts`.
5. Envuelve la app con `QueryClientProvider` en `app/_layout.tsx`.
6. Implementa la **feature Auth** (archivos de ejemplo).
7. Define grupos de rutas con **expo-router**: `(auth)` y `(tabs)`.
8. (Opcional) Configura **NativeWind** y un `theme.ts`.
9. Agrega linters/formatters (ESLint/Prettier) y alias en tsconfig (`@/* → src/*`).
10. Crea tests básicos del Login.

---

## Alias de imports (recomendado)

**tsconfig.json** (ejemplo de paths)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Próximos pasos sugeridos

* Añadir **protección de rutas** (redirigir a `(auth)` si no hay token; a `(tabs)` si hay sesión).
* Manejo centralizado de **errors/toasts** por feature.
* Agregar **interceptor de Axios** para inyectar el token y refresco.
* Definir **design system** (espaciados, tipografía, colores) en `shared/ui/`.
* Configurar **CI** (lint + tests) y **versionado**.

---

## Notas finales

* La clave está en **no acoplar la UI a Axios**. La UI solo usa hooks (`useLogin`) o casos de uso.
* Cada **feature** es porteable y tiene su propio store, hooks, UI y acceso a datos.
* Este es un esqueleto sólido que puedes ir llenando mientras avanzas.

##
# LumiXplore — Diseño de base de datos

Base de datos: PostgreSQL.
Catálogo externo: TMDB.

## Reglas generales

- Una cuenta tiene un solo método de acceso: local o Google.
- No se permite cambiar ni vincular métodos en la primera versión.
- Cada usuario tiene una sola configuración de preferencias.
- La lista personal admite películas y series.
- La recomendación diaria ignora preferencias, plataformas y estado de ánimo.
- Cada usuario recibe una recomendación por día, sin repetir títulos anteriores.
- Los invitados pueden explorar, pero no guardar listas ni preferencias.
- Los datos del catálogo se consultan en TMDB.
- Al eliminar una cuenta, se eliminan sus registros relacionados.
- El backend verifica la identidad y autoriza el acceso a los datos.

## 1. users

| Campo      | Tipo        | Obligatorio | Regla / valor inicial                      |
| ---------- | ----------- | ----------- | ------------------------------------------ |
| id         | uuid        | Sí          | Clave primaria, generado automáticamente   |
| name       | text        | Sí          | No vacío                                   |
| last_name  | text        | No          | NULL permitido; no vacío si se proporciona |
| email      | text        | Sí          | Único sin distinguir mayúsculas            |
| language   | text        | Sí          | es o en; predeterminado en                 |
| region     | text        | Sí          | Código de país de dos letras mayúsculas    |
| timezone   | text        | Sí          | Zona horaria válida; respaldo UTC          |
| created_at | timestamptz | Sí          | Fecha y hora actuales                      |
| updated_at | timestamptz | Sí          | Fecha y hora actuales al crear             |

El backend valida el correo, la región y la zona horaria.
updated_at se actualiza cuando cambia el registro.

## 2. auth_identities

| Campo            | Tipo        | Obligatorio | Regla / valor inicial                    |
| ---------------- | ----------- | ----------- | ---------------------------------------- |
| id               | uuid        | Sí          | Clave primaria, generado automáticamente |
| user_id          | uuid        | Sí          | Referencia a users.id; único             |
| provider         | text        | Sí          | local o google                           |
| provider_subject | text        | Condicional | Identificador sub de Google              |
| password_hash    | text        | Condicional | Hash de contraseña para acceso local     |
| created_at       | timestamptz | Sí          | Fecha y hora actuales                    |
| updated_at       | timestamptz | Sí          | Fecha y hora actuales al crear           |

Reglas:

- local exige password_hash no vacío y provider_subject NULL.
- google exige provider_subject no vacío y password_hash NULL.
- provider + provider_subject es único.
- Usuario e identidad se crean juntos en una transacción.
- No se guarda la contraseña original.
- No se vinculan cuentas automáticamente por coincidencia de correo.

## 3. user_preferences

| Campo        | Tipo        | Obligatorio | Regla / valor inicial                  |
| ------------ | ----------- | ----------- | -------------------------------------- |
| user_id      | uuid        | Sí          | Clave primaria y referencia a users.id |
| content_type | text        | Sí          | movie, tv o both; predeterminado both  |
| created_at   | timestamptz | Sí          | Fecha y hora actuales                  |
| updated_at   | timestamptz | Sí          | Fecha y hora actuales al crear         |

Se crea junto con la cuenta.
Restablecer preferencias conserva idioma y región.

## 4. preferred_genres

| Campo      | Tipo    | Obligatorio | Regla                 |
| ---------- | ------- | ----------- | --------------------- |
| user_id    | uuid    | Sí          | Referencia a users.id |
| genre_id   | integer | Sí          | ID positivo de TMDB   |
| media_type | text    | Sí          | movie o tv            |

Clave primaria compuesta: user_id + genre_id + media_type.

Sin filas significa sin restricción de género.
El backend valida el género para el tipo de contenido.

Pendiente: definir la correspondencia entre el selector unificado
de la interfaz y los catálogos de géneros de películas y series.

## 5. preferred_providers

| Campo       | Tipo    | Obligatorio | Regla                                   |
| ----------- | ------- | ----------- | --------------------------------------- |
| user_id     | uuid    | Sí          | Referencia a users.id                   |
| provider_id | integer | Sí          | ID positivo de TMDB                     |
| region      | text    | Sí          | Código de país de dos letras mayúsculas |

Clave primaria compuesta: user_id + provider_id + region.

Sin filas para una región significa sin restricción de plataformas.
El backend valida la selección contra la disponibilidad de la API.

## 6. watchlist_items

| Campo      | Tipo        | Obligatorio | Regla / valor inicial                    |
| ---------- | ----------- | ----------- | ---------------------------------------- |
| id         | uuid        | Sí          | Clave primaria, generado automáticamente |
| user_id    | uuid        | Sí          | Referencia a users.id                    |
| tmdb_id    | integer     | Sí          | ID positivo del título                   |
| media_type | text        | Sí          | movie o tv                               |
| created_at | timestamptz | Sí          | Fecha y hora actuales                    |

Combinación única: user_id + tmdb_id + media_type.

El backend permite consultar y modificar únicamente la lista propia.

## 7. daily_recommendations

| Campo               | Tipo        | Obligatorio | Regla / valor inicial                    |
| ------------------- | ----------- | ----------- | ---------------------------------------- |
| id                  | uuid        | Sí          | Clave primaria, generado automáticamente |
| user_id             | uuid        | Sí          | Referencia a users.id                    |
| recommendation_date | date        | Sí          | Día calculado por el backend             |
| tmdb_id             | integer     | Sí          | ID positivo del título                   |
| media_type          | text        | Sí          | movie o tv                               |
| created_at          | timestamptz | Sí          | Fecha y hora actuales                    |

Combinaciones únicas:

- user_id + recommendation_date.
- user_id + tmdb_id + media_type.

El día se calcula según la zona horaria guardada del usuario.
Se conserva el historial para evitar repetir títulos.
Si dos solicitudes intentan crear la recomendación del día,
el backend devuelve la que haya quedado guardada.

## 8. sessions

| Campo        | Tipo        | Obligatorio | Regla / valor inicial                       |
| ------------ | ----------- | ----------- | ------------------------------------------- |
| id           | uuid        | Sí          | Clave primaria, generado automáticamente    |
| user_id      | uuid        | Sí          | Referencia a users.id                       |
| token_hash   | text        | Sí          | Único y no vacío                            |
| created_at   | timestamptz | Sí          | Fecha y hora actuales                       |
| last_seen_at | timestamptz | Sí          | Fecha y hora actuales al crear              |
| expires_at   | timestamptz | Sí          | Vencimiento máximo calculado por el backend |
| revoked_at   | timestamptz | No          | NULL mientras no se revoque                 |

Reglas:

- expires_at es posterior a created_at.
- last_seen_at no es anterior a created_at.
- revoked_at, si existe, no es anterior a created_at.
- Un usuario puede tener varias sesiones.
- El navegador conserva el secreto en una cookie persistente.
- La base de datos guarda únicamente su hash.
- Cerrar sesión invalida la sesión en el servidor y elimina la cookie.
- La sesión de LumiXplore es independiente de la sesión de Google.

Política inicial propuesta:

- Vencimiento por 30 días de inactividad.
- Vencimiento máximo de 90 días desde el inicio.
- Ambos límites se comprueban en el backend.

## Relaciones y eliminación

Todas las columnas user_id referencian users.id con ON DELETE CASCADE.

## Pendientes antes de completar autenticación

- Definir verificación de correo.
- Definir recuperación de contraseña.
- Definir almacenamiento, caducidad y uso único de tokens temporales.
- Definir invalidación de sesiones ante cambios de credenciales.

## Responsabilidades

PostgreSQL:

- Claves primarias y foráneas.
- Campos obligatorios.
- Restricciones de valores.
- Unicidad.
- Eliminación en cascada.

Backend:

- Validación contra catálogos externos.
- Autenticación y autorización.
- Hash y verificación de contraseñas.
- Gestión de sesiones y tokens.
- Aplicación de filtros y estados de ánimo.
- Selección de recomendaciones.
- Operaciones relacionadas dentro de transacciones.

Frontend:

- Presentación y validación inmediata de formularios.
- Lectura del idioma del navegador.
- Selección o confirmación de región.
- Consulta de la sesión.
- Recomendación del invitado conservada en ese navegador.

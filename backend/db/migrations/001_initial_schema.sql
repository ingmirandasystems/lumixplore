BEGIN;

-- 1. Perfil del usuario
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (name ~ '[^[:space:]]'),
    last_name text CHECK (
        last_name IS NULL OR last_name ~ '[^[:space:]]'
    ),
    email text NOT NULL CHECK (
        email = btrim(email) AND email ~ '[^[:space:]]'
    ),
    language text NOT NULL DEFAULT 'en'
        CHECK (language IN ('es', 'en')),
    region text NOT NULL CHECK (region ~ '^[A-Z]{2}$'),
    timezone text NOT NULL DEFAULT 'UTC'
        CHECK (timezone ~ '[^[:space:]]'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Evita correos duplicados aunque cambien las mayúsculas.
CREATE UNIQUE INDEX users_email_unique
    ON public.users (lower(email));


-- 2. Método de acceso
CREATE TABLE public.auth_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE
        REFERENCES public.users(id) ON DELETE CASCADE,
    provider text NOT NULL
        CHECK (provider IN ('local', 'google')),
    provider_subject text,
    password_hash text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT auth_identities_provider_subject_unique
        UNIQUE (provider, provider_subject),

    CONSTRAINT auth_identities_credentials_check CHECK (
        (
            provider = 'local'
            AND password_hash IS NOT NULL
            AND password_hash ~ '[^[:space:]]'
            AND provider_subject IS NULL
        )
        OR
        (
            provider = 'google'
            AND provider_subject IS NOT NULL
            AND provider_subject ~ '[^[:space:]]'
            AND password_hash IS NULL
        )
    )
);


-- 3. Preferencia de tipo de contenido
CREATE TABLE public.user_preferences (
    user_id uuid PRIMARY KEY
        REFERENCES public.users(id) ON DELETE CASCADE,
    content_type text NOT NULL DEFAULT 'both'
        CHECK (content_type IN ('movie', 'tv', 'both')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- 4. Géneros seleccionados
CREATE TABLE public.preferred_genres (
    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    genre_id integer NOT NULL CHECK (genre_id > 0),
    media_type text NOT NULL
        CHECK (media_type IN ('movie', 'tv')),

    PRIMARY KEY (user_id, genre_id, media_type)
);


-- 5. Plataformas seleccionadas por región
CREATE TABLE public.preferred_providers (
    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id integer NOT NULL CHECK (provider_id > 0),
    region text NOT NULL CHECK (region ~ '^[A-Z]{2}$'),

    PRIMARY KEY (user_id, provider_id, region)
);


-- 6. Lista personal
CREATE TABLE public.watchlist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    tmdb_id integer NOT NULL CHECK (tmdb_id > 0),
    media_type text NOT NULL
        CHECK (media_type IN ('movie', 'tv')),
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT watchlist_items_title_unique
        UNIQUE (user_id, tmdb_id, media_type)
);


-- 7. Recomendaciones diarias e historial
CREATE TABLE public.daily_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    recommendation_date date NOT NULL,
    tmdb_id integer NOT NULL CHECK (tmdb_id > 0),
    media_type text NOT NULL
        CHECK (media_type IN ('movie', 'tv')),
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT daily_recommendations_day_unique
        UNIQUE (user_id, recommendation_date),

    CONSTRAINT daily_recommendations_title_unique
        UNIQUE (user_id, tmdb_id, media_type)
);


-- 8. Sesiones persistentes
CREATE TABLE public.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE
        CHECK (token_hash ~ '[^[:space:]]'),
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,

    CONSTRAINT sessions_expiration_check
        CHECK (expires_at > created_at),

    CONSTRAINT sessions_last_seen_check
        CHECK (last_seen_at >= created_at),

    CONSTRAINT sessions_revocation_check
        CHECK (
            revoked_at IS NULL OR revoked_at >= created_at
        )
);

CREATE INDEX sessions_user_id_index
    ON public.sessions (user_id);


-- Actualización automática de updated_at
CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER auth_identities_set_updated_at
    BEFORE UPDATE ON public.auth_identities
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_preferences_set_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

COMMIT;
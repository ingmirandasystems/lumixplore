BEGIN;

-- NULL significa que el correo todavía no está verificado.
ALTER TABLE public.users
    ADD COLUMN email_verified_at timestamptz;

-- Enlaces temporales de verificación y recuperación.
CREATE TABLE public.auth_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    purpose text NOT NULL
        CHECK (
            purpose IN ('email_verification', 'password_reset')
        ),

    token_hash text NOT NULL UNIQUE
        CHECK (token_hash ~ '[^[:space:]]'),

    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    revoked_at timestamptz,

    CONSTRAINT auth_tokens_expiration_check
        CHECK (expires_at > created_at),

    CONSTRAINT auth_tokens_usage_check
        CHECK (
            used_at IS NULL OR used_at >= created_at
        ),

    CONSTRAINT auth_tokens_revocation_check
        CHECK (
            revoked_at IS NULL OR revoked_at >= created_at
        )
);

CREATE INDEX auth_tokens_user_purpose_index
    ON public.auth_tokens (user_id, purpose);

COMMIT;
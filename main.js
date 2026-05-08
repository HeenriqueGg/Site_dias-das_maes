-- ============================================================
-- Estrutura SQL para o Supabase
-- Tabelas para armazenar mensagens, fotos e vídeos
-- ============================================================

-- ========== TABELA DE MENSAGENS ==========
-- Armazena mensagens de carinho enviadas através do site
CREATE TABLE IF NOT EXISTS messages (
    id          BIGSERIAL       PRIMARY KEY,
    name        TEXT            NOT NULL DEFAULT 'Anônimo',
    message     TEXT            NOT NULL,
    emotion     TEXT            DEFAULT NULL,       -- ex: 'gratidão', 'saudade', 'carinho'
    is_public   BOOLEAN         DEFAULT FALSE,
    created_at  TIMESTAMPTZ     DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     DEFAULT NOW()
);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON messages (created_at DESC);

-- Índice para mensagens públicas (exibir no site)
CREATE INDEX IF NOT EXISTS idx_messages_public
    ON messages (is_public, created_at DESC)
    WHERE is_public = TRUE;

-- ========== TABELA DE FOTOS ==========
-- Armazena referências e metadados das fotos da galeria
CREATE TABLE IF NOT EXISTS photos (
    id          BIGSERIAL       PRIMARY KEY,
    url         TEXT            NOT NULL,           -- URL pública da foto no bucket
    caption     TEXT            DEFAULT '',
    alt_text    TEXT            DEFAULT 'Memória especial',
    position    INTEGER         DEFAULT 0,          -- ordem na galeria
    is_active   BOOLEAN         DEFAULT TRUE,
    created_at  TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_active
    ON photos (is_active, position)
    WHERE is_active = TRUE;

-- ========== TABELA DE VÍDEOS ==========
-- Armazena referências e metadados dos vídeos
CREATE TABLE IF NOT EXISTS videos (
    id          BIGSERIAL       PRIMARY KEY,
    url         TEXT            NOT NULL,           -- URL pública do vídeo no bucket
    title       TEXT            DEFAULT '',
    thumbnail   TEXT            DEFAULT NULL,       -- URL da thumbnail
    position    INTEGER         DEFAULT 0,
    is_active   BOOLEAN         DEFAULT TRUE,
    created_at  TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_active
    ON videos (is_active, position)
    WHERE is_active = TRUE;

-- ========== TABELA DE VISITAS (opcional, para carinho) ==========
-- Registra visitas ao site (apenas contagem, sem dados pessoais)
CREATE TABLE IF NOT EXISTS visits (
    id          BIGSERIAL       PRIMARY KEY,
    page        TEXT            DEFAULT 'home',
    visited_at  TIMESTAMPTZ     DEFAULT NOW()
);

-- ========== FUNÇÃO PARA ATUALIZAR updated_at ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_messages
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========== EXEMPLOS DE INSERTS ==========
-- Mensagens de exemplo
INSERT INTO messages (name, message, emotion, is_public) VALUES
('De coração', 'Você é a prova de que o amor não precisa de laços de sangue para ser verdadeiro. Obrigado por tudo!', 'gratidão', TRUE),
('Com carinho', 'Lembro de cada gesto, cada cuidado. Você transformou minha vida com sua presença.', 'carinho', TRUE),
('Para sempre grato', 'As pessoas passam, mas algumas deixam marcas eternas. Você é dessas.', 'gratidão', FALSE);

-- Fotos de exemplo (substitua as URLs pelas do seu bucket)
INSERT INTO photos (url, caption, alt_text, position) VALUES
('assets/images/photo1.jpg', 'Dias que o coração guardou.', 'Momento especial juntos', 1),
('assets/images/photo2.jpg', 'Alegria que nasce do afeto.', 'Sorrindo juntos', 2),
('assets/images/photo3.jpg', 'Abrigo em forma de gente.', 'Abraço apertado', 3);

-- Vídeos de exemplo
INSERT INTO videos (url, title, thumbnail, position) VALUES
('assets/videos/memory1.mp4', 'Um instante que diz tudo', 'assets/images/video-thumb1.jpg', 1),
('assets/videos/memory2.mp4', 'Risadas que ecoam no coração', 'assets/images/video-thumb2.jpg', 2);

-- ========== POLÍTICAS DE SEGURANÇA (RLS) ==========
-- Habilita Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode inserir mensagens
CREATE POLICY "Permitir inserção pública de mensagens"
    ON messages FOR INSERT
    WITH CHECK (TRUE);

-- Política: qualquer pessoa pode ler mensagens públicas
CREATE POLICY "Permitir leitura de mensagens públicas"
    ON messages FOR SELECT
    USING (is_public = TRUE);

-- Política: fotos públicas podem ser lidas por qualquer pessoa
CREATE POLICY "Permitir leitura de fotos ativas"
    ON photos FOR SELECT
    USING (is_active = TRUE);

-- Política: vídeos públicos podem ser lidos por qualquer pessoa
CREATE POLICY "Permitir leitura de vídeos ativos"
    ON videos FOR SELECT
    USING (is_active = TRUE);

-- ========== BUCKETS DE STORAGE (para upload de arquivos) ==========
-- Execute estes comandos no painel do Supabase ou via SQL Editor:
-- 1. Crie os buckets:
--    - 'photos' (para imagens da galeria)
--    - 'videos' (para arquivos de vídeo)
-- 2. Configure as políticas de acesso público para leitura

-- Exemplo de política de storage para o bucket 'photos':
/*
CREATE POLICY "Acesso público de leitura para photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'photos');
*/

-- Exemplo de política de storage para o bucket 'videos':
/*
CREATE POLICY "Acesso público de leitura para videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'videos');
*/
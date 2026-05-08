// ============================================================
// main.js — Lógica principal do site
// Integração com Supabase, carregamento de dados,
// navegação, modais, música e inicialização geral
// ============================================================

/* ========== CONFIGURAÇÃO DO SUPABASE ========== */
// ⚠️ IMPORTANTE: Substitua pelos valores reais do seu projeto Supabase
// ou configure as variáveis de ambiente na Vercel
const SUPABASE_CONFIG = {
    url: 'https://seu-projeto.supabase.co',      // ← SUBSTITUA
    anonKey: 'sua-chave-anon-aqui'                // ← SUBSTITUA
};

/* ========== ESTADO GLOBAL ========== */
let supabaseClient = null;
let messagesData = null;
let musicPlaying = false;

/* ========== INICIALIZAÇÃO ========== */
document.addEventListener('DOMContentLoaded', async () => {
    // Esconde a tela de carregamento após um breve delay (efeito cinematográfico)
    setTimeout(hideLoadingScreen, 1800);

    // Inicializa o Supabase (se configurado)
    await initSupabase();

    // Carrega os dados do JSON local
    await loadMessagesData();

    // Preenche as seções dinâmicas
    populateLetter();
    populateGallery();
    populateVideos();
    populateTimeline();
    populateCards();

    // Configura eventos
    setupNavigation();
    setupMusicToggle();
    setupLightbox();
    setupVideoModal();
    setupHeaderScroll();
});

/* ========== LOADING SCREEN ========== */
function hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    if (loading) {
        loading.classList.add('loading-screen--hidden');
        // Remove o elemento após a transição
        setTimeout(() => {
            if (loading.parentNode) {
                loading.parentNode.removeChild(loading);
            }
        }, 900);
    }
}

/* ========== SUPABASE ========== */
async function initSupabase() {
    // Só inicializa se as credenciais foram configuradas
    if (SUPABASE_CONFIG.url.includes('seu-projeto') ||
        SUPABASE_CONFIG.anonKey.includes('sua-chave')) {
        console.warn('⚠️ Supabase não configurado. Usando dados locais (JSON).');
        console.warn('   Para conectar ao Supabase, edite SUPABASE_CONFIG em main.js');
        return;
    }
    try {
        // Verifica se o SDK foi carregado
        if (typeof window.supabase === 'undefined') {
            console.warn('⚠️ SDK do Supabase não carregado. Usando dados locais.');
            return;
        }
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase conectado com sucesso!');

        // Tenta carregar mensagens adicionais do banco
        await loadSupabaseMessages();
    } catch (error) {
        console.warn('⚠️ Erro ao conectar ao Supabase:', error.message);
    }
}

async function loadSupabaseMessages() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) throw error;
        if (data && data.length > 0) {
            console.log(`📨 ${data.length} mensagens carregadas do Supabase.`);
            // Armazena para uso futuro (ex: exibir mensagens adicionais)
            window.supabaseMessages = data;
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar mensagens do Supabase:', error.message);
    }
}

/* ========== CARREGAR DADOS DO JSON ========== */
async function loadMessagesData() {
    try {
        const response = await fetch('data/messages.json');
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        messagesData = await response.json();
        console.log('📋 Dados do JSON carregados com sucesso.');
    } catch (error) {
        console.error('❌ Erro ao carregar messages.json:', error.message);
        // Fallback: dados mínimos para o site não quebrar
        messagesData = getFallbackData();
    }
}

function getFallbackData() {
    return {
        hero: {
            title: "Nem sempre mãe é quem gera… às vezes é quem acolhe.",
            subtitle: "Para aquela que se tornou abrigo, mesmo sem precisar."
        },
        letter: {
            paragraphs: [
                "Por mais que não sejamos de sangue, você foi ponto de refúgio na minha vida. Foi esperança na correria, ajuda no momento de socorro. Se precisei de uma mãe por alguns meses, você foi essa mãe.",
                "E apesar das brigas e desentendimentos, quero que saiba que sou grato por tudo. Me desculpe caso eu tenha feito algo que você não gostou, nunca foi por mal. Você foi tudo de bom…"
            ],
            signature: "Com todo meu carinho e gratidão eterna"
        },
        gallery: {
            images: [],
            captions: [
                "Momentos simples que ficaram eternos.",
                "Família também nasce do cuidado.",
                "Algumas pessoas entram na vida da gente como resposta."
            ]
        },
        videos: [],
        timeline: [
            "Nos dias difíceis, você estava lá.",
            "Nas conversas simples, eu encontrava paz.",
            "Mesmo nas broncas, existia cuidado.",
            "Você virou abrigo sem perceber."
        ],
        cards: [
            { icon: "🏠", text: "Você foi refúgio." },
            { icon: "🤲", text: "Você foi cuidado." },
            { icon: "💪", text: "Você foi apoio." },
            { icon: "👨‍👩‍👧", text: "Você foi família." },
            { icon: "✨", text: "Você foi resposta." }
        ],
        closing: {
            quote: "Talvez o sangue aproxime pessoas… mas o amor, o cuidado e o carinho são o que realmente criam uma família.",
            title: "Feliz Dia das Mães ❤️"
        }
    };
}

/* ========== POPULAR CARTA (com efeito de máquina de escrever) ========== */
function populateLetter() {
    const letterContent = document.getElementById('letter-content');
    const letterSignature = document.getElementById('letter-signature');
    if (!letterContent || !messagesData?.letter) return;

    const paragraphs = messagesData.letter.paragraphs;
    const allLines = [];

    // Converte parágrafos em linhas para o efeito de digitação
    paragraphs.forEach((paragraph, pIndex) => {
        // Divide parágrafos muito longos em frases
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        sentences.forEach((sentence, sIndex) => {
            allLines.push({
                text: sentence.trim(),
                isParagraphBreak: sIndex === 0 && pIndex > 0
            });
        });
        // Adiciona quebra de parágrafo
        if (pIndex < paragraphs.length - 1) {
            allLines.push({ text: '', isParagraphBreak: true });
        }
    });

    // Efeito de máquina de escrever sequencial
    let globalLineIndex = 0;
    const typingSpeed = 35; // ms por caractere
    const linePause = 400;  // pausa entre linhas

    function typeNextLine() {
        if (globalLineIndex >= allLines.length) {
            // Revela assinatura
            if (letterSignature) {
                letterSignature.classList.add('letter-signature--visible');
            }
            return;
        }

        const lineData = allLines[globalLineIndex];
        const lineElement = document.createElement('span');
        lineElement.classList.add('typed-line');
        if (lineData.isParagraphBreak) {
            lineElement.classList.add('paragraph-break');
        }
        letterContent.appendChild(lineElement);

        if (lineData.text === '') {
            // Linha vazia (quebra de parágrafo visual)
            lineElement.innerHTML = '&nbsp;';
            lineElement.style.opacity = '1';
            globalLineIndex++;
            setTimeout(typeNextLine, linePause);
            return;
        }

        // Efeito de digitação caractere por caractere
        let charIndex = 0;
        const text = lineData.text;

        function typeChar() {
            if (charIndex < text.length) {
                lineElement.textContent += text.charAt(charIndex);
                charIndex++;
                // Velocidade ligeiramente variável para parecer natural
                const speed = typingSpeed + Math.random() * 25;
                setTimeout(typeChar, speed);
            } else {
                // Linha completa
                lineElement.style.opacity = '1';
                globalLineIndex++;
                setTimeout(typeNextLine, linePause + text.length * 2);
            }
        }

        typeChar();
    }

    // Pequeno delay antes de começar a digitar
    setTimeout(typeNextLine, 600);
}

/* ========== POPULAR GALERIA ========== */
function populateGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid || !messagesData?.gallery) return;

    const images = messagesData.gallery.images || [];
    const captions = messagesData.gallery.captions || [];

    if (images.length === 0) {
        // Placeholder elegante se não houver fotos
        grid.innerHTML = `
            <div class="gallery-item" style="background: var(--glass-bg); display: flex; align-items: center; justify-content: center; min-height: 300px; grid-column: 1 / -1;">
                <p style="color: var(--color-gold-soft); font-style: italic; text-align: center; padding: 2rem;">
                    🌸<br><br>Adicione suas fotos na pasta<br><code>/assets/images/</code><br>e configure o arquivo<br><code>data/messages.json</code>
                </p>
            </div>`;
        return;
    }

    images.forEach((img, index) => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        item.setAttribute('data-index', index);

        const caption = img.caption || captions[index % captions.length] || '';

        item.innerHTML = `
            <img src="${img.src}" alt="${img.alt || 'Memória especial'}" loading="lazy">
            <div class="gallery-item-overlay">
                <span class="gallery-item-caption">${caption}</span>
            </div>
        `;

        item.addEventListener('click', () => openLightbox(img.src, caption));
        grid.appendChild(item);
    });

    // Legenda aleatória
    const randomCaption = document.getElementById('gallery-random-caption');
    if (randomCaption && captions.length > 0) {
        const random = captions[Math.floor(Math.random() * captions.length)];
        randomCaption.textContent = `"${random}"`;
    }
}

/* ========== POPULAR VÍDEOS ========== */
function populateVideos() {
    const grid = document.getElementById('videos-grid');
    if (!grid || !messagesData?.videos) return;

    const videos = messagesData.videos || [];

    if (videos.length === 0) {
        grid.innerHTML = `
            <div class="video-card" style="background: var(--glass-bg); display: flex; align-items: center; justify-content: center; min-height: 200px; grid-column: 1 / -1;">
                <p style="color: var(--color-gold-soft); font-style: italic; text-align: center; padding: 2rem;">
                    🎬<br><br>Adicione seus vídeos na pasta<br><code>/assets/videos/</code><br>e configure o arquivo<br><code>data/messages.json</code>
                </p>
            </div>`;
        return;
    }

    videos.forEach((video, index) => {
        const card = document.createElement('div');
        card.classList.add('video-card');
        card.setAttribute('data-video-index', index);

        card.innerHTML = `
            <video class="video-card-thumb" muted preload="metadata" playsinline
                   src="${video.src}#t=0.5"
                   onloadedmetadata="this.currentTime=1;"
                   onmouseenter="this.play()"
                   onmouseleave="this.pause(); this.currentTime=1;">
            </video>
            <div class="video-card-info">
                <span class="video-card-title">${video.title || 'Memória em vídeo'}</span>
            </div>
            <div class="video-card-play">▶</div>
        `;

        card.addEventListener('click', () => openVideoModal(video.src, video.title));
        grid.appendChild(card);
    });
}

/* ========== POPULAR TIMELINE ========== */
function populateTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container || !messagesData?.timeline) return;

    const items = messagesData.timeline || [];

    items.forEach((text, index) => {
        const item = document.createElement('div');
        item.classList.add('timeline-item');
        item.setAttribute('data-animate', 'fade-up');
        item.style.transitionDelay = `${index * 0.15}s`;

        item.innerHTML = `
            <div class="timeline-item-dot"></div>
            <div class="timeline-item-content">
                <p class="timeline-item-text">${text}</p>
            </div>
        `;

        container.appendChild(item);
    });

    // Dispara a verificação de visibilidade após popular
    if (typeof window.triggerScrollCheck === 'function') {
        setTimeout(window.triggerScrollCheck, 200);
    }
}

/* ========== POPULAR CARDS EMOCIONAIS ========== */
function populateCards() {
    const grid = document.getElementById('cards-grid');
    if (!grid || !messagesData?.cards) return;

    const cards = messagesData.cards || [];

    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.classList.add('emotional-card');
        cardEl.setAttribute('data-animate', 'fade-up');
        cardEl.style.transitionDelay = `${index * 0.12}s`;

        cardEl.innerHTML = `
            <span class="emotional-card-icon">${card.icon}</span>
            <p class="emotional-card-text">${card.text}</p>
        `;

        grid.appendChild(cardEl);
    });

    if (typeof window.triggerScrollCheck === 'function') {
        setTimeout(window.triggerScrollCheck, 200);
    }
}

/* ========== NAVEGAÇÃO SUAVE ========== */
function setupNavigation() {
    // Botão CTA da hero
    const ctaButton = document.getElementById('hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            const cartaSection = document.getElementById('carta');
            if (cartaSection) {
                cartaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Links de navegação
    document.querySelectorAll('.nav-link, a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = document.getElementById('site-header')?.offsetHeight || 60;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

/* ========== MÚSICA AMBIENTE ========== */
function setupMusicToggle() {
    const toggle = document.getElementById('music-toggle');
    const audio = document.getElementById('bg-music');
    if (!toggle || !audio) return;

    const iconOff = toggle.querySelector('.music-icon--off');
    const iconOn = toggle.querySelector('.music-icon--on');

    toggle.addEventListener('click', () => {
        if (musicPlaying) {
            audio.pause();
            toggle.classList.remove('music-toggle--playing');
            if (iconOff) iconOff.style.display = 'block';
            if (iconOn) iconOn.style.display = 'none';
            toggle.setAttribute('aria-label', 'Ativar música ambiente');
        } else {
            audio.play().then(() => {
                toggle.classList.add('music-toggle--playing');
                if (iconOff) iconOff.style.display = 'none';
                if (iconOn) iconOn.style.display = 'block';
                toggle.setAttribute('aria-label', 'Desativar música ambiente');
            }).catch(err => {
                console.warn('⚠️ Não foi possível reproduzir a música:', err.message);
                // Tenta novamente com interação do usuário
            });
        }
        musicPlaying = !musicPlaying;
    });

    // Tenta pré-carregar o áudio
    audio.load();
}

/* ========== LIGHTBOX PARA FOTOS ========== */
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = lightbox?.querySelector('.lightbox-close');

    if (!lightbox || !lightboxImg) return;

    window.openLightbox = function(src, caption) {
        lightboxImg.src = src;
        lightboxImg.alt = caption || 'Foto';
        if (lightboxCaption) lightboxCaption.textContent = caption || '';
        lightbox.classList.add('lightbox--open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
        lightbox.classList.remove('lightbox--open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Limpa a src após a transição para evitar consumo de recursos
        setTimeout(() => {
            if (!lightbox.classList.contains('lightbox--open')) {
                lightboxImg.src = '';
            }
        }, 500);
    }

    if (closeBtn) closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) {
            closeLightbox();
        }
    });
}

/* ========== MODAL DE VÍDEO ========== */
function setupVideoModal() {
    const modal = document.getElementById('video-modal');
    const player = document.getElementById('video-modal-player');
    const titleEl = document.getElementById('video-modal-title');
    const closeBtn = modal?.querySelector('.lightbox-close');

    if (!modal || !player) return;

    window.openVideoModal = function(src, title) {
        player.src = src;
        player.load();
        if (titleEl) titleEl.textContent = title || '';
        modal.classList.add('lightbox--open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        player.play().catch(() => {});
    };

    function closeVideoModal() {
        player.pause();
        player.src = '';
        modal.classList.remove('lightbox--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeVideoModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeVideoModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('lightbox--open')) {
            closeVideoModal();
        }
    });
}

/* ========== HEADER SCROLL EFFECT ========== */
function setupHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        // Debounce para performance
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            if (window.scrollY > 80) {
                header.classList.add('site-header--scrolled');
            } else {
                header.classList.remove('site-header--scrolled');
            }
        }, 50);
    }, { passive: true });
}

/* ========== EXPORT PARA USO EM OUTROS MÓDULOS ========== */
// (Funções expostas no escopo global para acesso por animations.js se necessário)
window.openLightbox = window.openLightbox || function() {};
window.openVideoModal = window.openVideoModal || function() {};
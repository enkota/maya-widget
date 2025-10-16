const DEFAULTS = {
    botIntegrationId: '',
    baseUrl: 'https://maya.test',
    position: {
        bottom: '20px',
        right: '20px'
    },
    size: {
        width: '60px',
        height: '60px'
    },
    colors: {
        primary: '#0084ff',
        iconFill: '#ffffff',
        background: '#ffffff'
    },
    hideBranding: false,
    zIndex: 2147483000,
    fetchRemoteConfig: true,
    configurationEndpoint: '/api/website-widget/configuration',
    buttonVariant: 'classic',
    buttonImageUrl: undefined
};
const STYLE_TAG_ID = 'maya-chatbot-widget-styles';
export default class ChatbotWidget {
    constructor(options) {
        this.container = null;
        this.chatWindow = null;
        this.chatHeader = null;
        this.closeBtn = null;
        this.chatButton = null;
        this.iframe = null;
        this.isOpen = false;
        if (!options || !options.botIntegrationId) {
            throw new Error("[Maya Widget] 'botIntegrationId' is required during initialization.");
        }
        this.config = this.resolveOptions(options);
        this.buttonVariant = this.config.buttonVariant;
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            throw new Error('[Maya Widget] The widget must be initialised in a browser environment.');
        }
        void this.bootstrap();
    }
    open() {
        if (!this.chatWindow || !this.chatButton)
            return;
        this.isOpen = true;
        this.chatWindow.classList.add('open');
        this.chatButton.classList.add('open');
        this.handleResize();
    }
    close() {
        if (!this.chatWindow || !this.chatButton)
            return;
        this.isOpen = false;
        this.chatWindow.classList.remove('open');
        this.chatButton.classList.remove('open');
        this.resetViewportAdjustments();
    }
    toggle() {
        if (this.isOpen) {
            this.close();
        }
        else {
            this.open();
        }
    }
    destroy() {
        this.removeEventListeners();
        const styleElement = document.getElementById(STYLE_TAG_ID);
        if (styleElement) {
            styleElement.remove();
        }
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.container = null;
        this.chatWindow = null;
        this.chatButton = null;
        this.iframe = null;
    }
    resolveOptions(options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        return {
            botIntegrationId: options.botIntegrationId,
            baseUrl: (_a = options.baseUrl) !== null && _a !== void 0 ? _a : DEFAULTS.baseUrl,
            position: {
                bottom: (_c = (_b = options.position) === null || _b === void 0 ? void 0 : _b.bottom) !== null && _c !== void 0 ? _c : DEFAULTS.position.bottom,
                right: (_e = (_d = options.position) === null || _d === void 0 ? void 0 : _d.right) !== null && _e !== void 0 ? _e : DEFAULTS.position.right
            },
            size: {
                width: (_g = (_f = options.size) === null || _f === void 0 ? void 0 : _f.width) !== null && _g !== void 0 ? _g : DEFAULTS.size.width,
                height: (_j = (_h = options.size) === null || _h === void 0 ? void 0 : _h.height) !== null && _j !== void 0 ? _j : DEFAULTS.size.height
            },
            colors: {
                primary: (_l = (_k = options.colors) === null || _k === void 0 ? void 0 : _k.primary) !== null && _l !== void 0 ? _l : DEFAULTS.colors.primary,
                iconFill: (_o = (_m = options.colors) === null || _m === void 0 ? void 0 : _m.iconFill) !== null && _o !== void 0 ? _o : DEFAULTS.colors.iconFill,
                background: (_q = (_p = options.colors) === null || _p === void 0 ? void 0 : _p.background) !== null && _q !== void 0 ? _q : DEFAULTS.colors.background
            },
            hideBranding: (_r = options.hideBranding) !== null && _r !== void 0 ? _r : DEFAULTS.hideBranding,
            zIndex: (_s = options.zIndex) !== null && _s !== void 0 ? _s : DEFAULTS.zIndex,
            fetchRemoteConfig: (_t = options.fetchRemoteConfig) !== null && _t !== void 0 ? _t : DEFAULTS.fetchRemoteConfig,
            configurationEndpoint: (_u = options.configurationEndpoint) !== null && _u !== void 0 ? _u : DEFAULTS.configurationEndpoint,
            buttonVariant: (_v = options.buttonVariant) !== null && _v !== void 0 ? _v : DEFAULTS.buttonVariant,
            buttonImageUrl: (_w = options.buttonImageUrl) !== null && _w !== void 0 ? _w : DEFAULTS.buttonImageUrl
        };
    }
    async bootstrap() {
        this.createContainer();
        await this.tryFetchRemoteConfig();
        this.injectStyles();
        this.createChatWindow();
        this.createButton();
        this.addEventListeners();
    }
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'maya-chatbot-widget';
        this.container.setAttribute('data-integration', this.config.botIntegrationId);
        this.container.style.position = 'fixed';
        this.container.style.bottom = this.config.position.bottom;
        this.container.style.right = this.config.position.right;
        this.container.style.zIndex = String(this.config.zIndex);
        this.container.style.pointerEvents = 'auto';
        document.body.appendChild(this.container);
    }
    getRemoteConfigUrl() {
        const { baseUrl, configurationEndpoint, botIntegrationId } = this.config;
        const endpoint = configurationEndpoint.replace(/\/$/, '');
        if (endpoint.includes('{botIntegrationId}')) {
            return `${baseUrl}${endpoint.replace('{botIntegrationId}', encodeURIComponent(botIntegrationId))}`;
        }
        const separator = endpoint.startsWith('/') ? '' : '/';
        return `${baseUrl}${separator}${endpoint}/${encodeURIComponent(botIntegrationId)}`;
    }
    async tryFetchRemoteConfig() {
        var _a, _b, _c, _d, _e;
        if (!this.config.fetchRemoteConfig)
            return;
        try {
            const response = await fetch(this.getRemoteConfigUrl(), {
                headers: { Accept: 'application/json' }
            });
            if (!response.ok)
                return;
            const payload = await response.json();
            const remote = payload === null || payload === void 0 ? void 0 : payload.data;
            if (!remote)
                return;
            if (typeof remote.hideBranding === 'boolean') {
                this.config.hideBranding = remote.hideBranding;
            }
            if (remote.buttonType) {
                this.buttonVariant = remote.buttonType;
                this.config.buttonVariant = remote.buttonType;
            }
            if (remote.buttonImageUrl) {
                this.config.buttonImageUrl = remote.buttonImageUrl;
            }
            if (remote.colors) {
                this.config.colors = {
                    primary: (_a = remote.colors.primary) !== null && _a !== void 0 ? _a : this.config.colors.primary,
                    iconFill: (_b = remote.colors.iconFill) !== null && _b !== void 0 ? _b : this.config.colors.iconFill,
                    background: (_c = remote.colors.background) !== null && _c !== void 0 ? _c : this.config.colors.background
                };
            }
            if (remote.size) {
                this.config.size = {
                    width: (_d = remote.size.width) !== null && _d !== void 0 ? _d : this.config.size.width,
                    height: (_e = remote.size.height) !== null && _e !== void 0 ? _e : this.config.size.height
                };
            }
        }
        catch (error) {
            console.warn('[Maya Widget] Failed to fetch remote configuration', error);
        }
    }
    injectStyles() {
        const existing = document.getElementById(STYLE_TAG_ID);
        if (existing)
            existing.remove();
        const style = document.createElement('style');
        style.id = STYLE_TAG_ID;
        style.textContent = this.buildStyleSheet();
        document.head.appendChild(style);
    }
    buildStyleSheet() {
        const { colors, size, position, zIndex } = this.config;
        const buttonSelector = '#maya-chatbot-widget .maya-chatbot-button';
        const windowSelector = '#maya-chatbot-widget .maya-chatbot-window';
        const headerSelector = '#maya-chatbot-widget .maya-chatbot-header';
        const closeSelector = '#maya-chatbot-widget .maya-chatbot-close';
        const baseStyles = `
      ${buttonSelector} {
        position: fixed;
        bottom: ${position.bottom};
        bottom: 10px;
        right: ${position.right};
        width: ${size.width};
        height: ${size.height};
        border-radius: 50%;
        background: ${colors.primary};
        border: none;
        outline: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
        transition: transform 0.2s ease, opacity 0.2s ease;
        color: ${colors.iconFill};
        z-index: ${zIndex + 1};
        overflow: hidden;
      }
      ${buttonSelector}:hover {
        transform: scale(1.05);
      }
      /* Icon swap: chat-icon shown by default, close-icon on open */
      ${buttonSelector} .chat-icon { display: inline-flex; }
      ${buttonSelector} .close-icon { display: none; }
      ${buttonSelector}.open .chat-icon { display: none; }
      ${buttonSelector}.open .close-icon { display: inline-flex; }
      ${buttonSelector} svg { width: 28px; height: 28px; fill: currentColor; }

      ${windowSelector} {
        position: fixed;
        bottom: calc(${position.bottom} + ${size.height});
        right: ${position.right};
        width: min(420px, calc(100vw - 24px));
        height: min(70vh, 640px);
        background: ${colors.background};
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.25);
        overflow: hidden;
        display: none;
        flex-direction: column;
        transform-origin: bottom right;
        transform: scale(0.95) translateY(16px);
        opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
        z-index: ${zIndex};
      }
      ${windowSelector}.open {
        display: flex;
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      ${windowSelector}.mobile {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: calc(100vh - 96px);
        border-radius: 16px 16px 0 0;
      }
      ${windowSelector} iframe {
        width: 100%;
        height: calc(100% - 48px);
        border: 0;
        flex: 1;
      }
      ${headerSelector} {
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 8px;
        border-bottom: 1px solid rgba(0,0,0,.06);
        background: ${colors.background};
      }
      ${closeSelector} {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid rgba(0,0,0,.12);
        background: #ffffff;
        color: #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      ${closeSelector}:hover { filter: brightness(0.98); }
      ${windowSelector} .maya-chatbot-footer {
        font-size: 12px;
        text-align: center;
        padding: 8px;
        color: #4b5563;
        background: rgba(243, 244, 246, 0.95);
      }
      ${windowSelector} .maya-chatbot-footer a {
        color: ${colors.primary};
        text-decoration: none;
        font-weight: 600;
      }

      @media (max-width: 600px) {
        ${buttonSelector} {
          width: 56px;
          height: 56px;
        }
        ${windowSelector} {
          bottom: calc(${position.bottom} + 12px);
          right: 12px;
          left: 12px;
          width: auto;
          height: calc(100vh - 72px);
          max-height: 100vh;
          border-radius: 12px;
        }
        ${windowSelector} iframe { height: calc(100% - 48px); }
      }
    `;
        const tertiary = this.buttonVariant === 'live_agent' ? this.buildLiveAgentStyles(buttonSelector) : '';
        return `${baseStyles}\n${tertiary}`;
    }
    buildLiveAgentStyles(selector) {
        return `
      ${selector} {
        background: transparent;
        padding: 0;
      }
      ${selector} img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
        transition: opacity 0.3s ease;
      }
      ${selector}.open img {
        opacity: 0.5;
      }
    `;
    }
    createChatWindow() {
        if (!this.container)
            return;
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'maya-chatbot-window';
        this.ensureViewportMetaTag();
        // Header with close button for reliable closing on mobile
        this.chatHeader = document.createElement('div');
        this.chatHeader.className = 'maya-chatbot-header';
        this.closeBtn = document.createElement('button');
        this.closeBtn.type = 'button';
        this.closeBtn.className = 'maya-chatbot-close';
        this.closeBtn.setAttribute('aria-label', 'Close chat');
        this.closeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
        this.closeBtn.addEventListener('click', () => this.close());
        this.chatHeader.appendChild(this.closeBtn);
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'maya-chatbot-iframe';
        this.iframe.src = this.resolveChatUrl();
        this.iframe.allow = 'microphone; camera';
        this.iframe.title = 'Maya chat';
        this.chatWindow.appendChild(this.chatHeader);
        this.chatWindow.appendChild(this.iframe);
        if (!this.config.hideBranding) {
            const footer = document.createElement('div');
            footer.className = 'maya-chatbot-footer';
            const referrer = encodeURIComponent(window.location.hostname);
            footer.innerHTML = `Powered by <a href="https://maya.test?ref=${referrer}" target="_blank" rel="noopener">Maya</a>`;
            this.chatWindow.appendChild(footer);
        }
        this.container.appendChild(this.chatWindow);
    }
    createButton() {
        if (!this.container)
            return;
        this.chatButton = document.createElement('button');
        this.chatButton.type = 'button';
        this.chatButton.className = 'maya-chatbot-button';
        this.chatButton.setAttribute('aria-label', 'Open chat window');
        this.chatButton.innerHTML = this.buildButtonContent();
        this.chatButton.addEventListener('click', () => this.toggle());
        this.container.appendChild(this.chatButton);
    }
    buildButtonContent() {
        var _a;
        if (this.buttonVariant === 'live_agent') {
            const imageUrl = (_a = this.config.buttonImageUrl) !== null && _a !== void 0 ? _a : `${this.config.baseUrl}/assets/live-agent.png`;
            return `<img src="${imageUrl}" alt="Chat with us" />`;
        }
        return `
      <span class="chat-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm0 12H6l-2 2V4h16v10z" fill="currentColor"/>
        </svg>
      </span>
      <span class="close-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>
    `;
    }
    ensureViewportMetaTag() {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1';
            document.head.appendChild(meta);
        }
    }
    resolveChatUrl() {
        const { baseUrl, botIntegrationId } = this.config;
        const trimmedBase = baseUrl.replace(/\/$/, '');
        return `${trimmedBase}/bots/${encodeURIComponent(botIntegrationId)}/chat`;
    }
    addEventListeners() {
        this.resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this.resizeHandler, { passive: true });
        this.viewportHandler = () => this.handleResize();
        window.addEventListener('orientationchange', this.viewportHandler);
    }
    removeEventListeners() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = undefined;
        }
        if (this.viewportHandler) {
            window.removeEventListener('orientationchange', this.viewportHandler);
            this.viewportHandler = undefined;
        }
    }
    handleResize() {
        if (!this.chatWindow)
            return;
        const isMobile = window.matchMedia('(max-width: 600px)').matches;
        if (isMobile) {
            this.chatWindow.classList.add('mobile');
        }
        else {
            this.chatWindow.classList.remove('mobile');
        }
    }
    resetViewportAdjustments() {
        if (!this.chatWindow)
            return;
        this.chatWindow.classList.remove('mobile');
    }
}

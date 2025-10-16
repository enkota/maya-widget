export interface WidgetPosition {
  bottom?: string
  right?: string
}

export interface WidgetSize {
  width?: string
  height?: string
}

export interface WidgetColors {
  primary?: string
  iconFill?: string
  background?: string
}

export interface ChatbotWidgetOptions {
  botIntegrationId: string
  baseUrl?: string
  position?: WidgetPosition
  size?: WidgetSize
  colors?: WidgetColors
  hideBranding?: boolean
  zIndex?: number
  fetchRemoteConfig?: boolean
  buttonVariant?: ButtonVariant
  buttonImageUrl?: string
}

interface ResolvedWidgetOptions {
  botIntegrationId: string
  baseUrl: string
  position: Required<WidgetPosition>
  size: Required<WidgetSize>
  colors: Required<WidgetColors>
  hideBranding: boolean
  zIndex: number
  fetchRemoteConfig: boolean
  buttonVariant: ButtonVariant
  buttonImageUrl?: string
}

interface RemoteWidgetConfig {
  hideBranding?: boolean
  buttonType?: 'classic' | 'live_agent'
  colors?: WidgetColors
  size?: WidgetSize
  buttonImageUrl?: string
}

type ButtonVariant = 'classic' | 'live_agent'

const DEFAULTS: ResolvedWidgetOptions = {
  botIntegrationId: '',
  baseUrl: 'https://supmaya.com',
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
  buttonVariant: 'classic',
  buttonImageUrl: undefined
}

const STYLE_TAG_ID = 'maya-chatbot-widget-styles'

export default class ChatbotWidget {
  private readonly config: ResolvedWidgetOptions
  private container: HTMLDivElement | null = null
  private chatWindow: HTMLDivElement | null = null
  private chatHeader: HTMLDivElement | null = null
  private closeBtn: HTMLButtonElement | null = null
  private chatButton: HTMLButtonElement | null = null
  private iframe: HTMLIFrameElement | null = null
  private isOpen = false
  private buttonVariant: ButtonVariant
  private resizeHandler?: () => void
  private viewportHandler?: () => void

  constructor(options: ChatbotWidgetOptions) {
    if (!options || !options.botIntegrationId) {
      throw new Error("[Maya Widget] 'botIntegrationId' is required during initialization.")
    }

    this.config = this.resolveOptions(options)
    this.buttonVariant = this.config.buttonVariant

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('[Maya Widget] The widget must be initialised in a browser environment.')
    }

    void this.bootstrap()
  }

  public open(): void {
    if (!this.chatWindow || !this.chatButton) return
    this.isOpen = true
    this.chatWindow.classList.add('open')
    this.chatButton.classList.add('open')
    this.handleResize()
  }

  public close(): void {
    if (!this.chatWindow || !this.chatButton) return
    this.isOpen = false
    this.chatWindow.classList.remove('open')
    this.chatButton.classList.remove('open')
    this.resetViewportAdjustments()
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  public destroy(): void {
    this.removeEventListeners()
    const styleElement = document.getElementById(STYLE_TAG_ID)
    if (styleElement) {
      styleElement.remove()
    }
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    this.container = null
    this.chatWindow = null
    this.chatButton = null
    this.iframe = null
  }

  private resolveOptions(options: ChatbotWidgetOptions): ResolvedWidgetOptions {
    return {
      botIntegrationId: options.botIntegrationId,
      baseUrl: options.baseUrl ?? DEFAULTS.baseUrl,
      position: {
        bottom: options.position?.bottom ?? DEFAULTS.position.bottom,
        right: options.position?.right ?? DEFAULTS.position.right
      },
      size: {
        width: options.size?.width ?? DEFAULTS.size.width,
        height: options.size?.height ?? DEFAULTS.size.height
      },
      colors: {
        primary: options.colors?.primary ?? DEFAULTS.colors.primary,
        iconFill: options.colors?.iconFill ?? DEFAULTS.colors.iconFill,
        background: options.colors?.background ?? DEFAULTS.colors.background
      },
      hideBranding: options.hideBranding ?? DEFAULTS.hideBranding,
      zIndex: options.zIndex ?? DEFAULTS.zIndex,
      fetchRemoteConfig: options.fetchRemoteConfig ?? DEFAULTS.fetchRemoteConfig,
      buttonVariant: options.buttonVariant ?? DEFAULTS.buttonVariant,
      buttonImageUrl: options.buttonImageUrl ?? DEFAULTS.buttonImageUrl
    }
  }

  private async bootstrap(): Promise<void> {
    this.createContainer()
    await this.tryFetchRemoteConfig()
    this.injectStyles()
    this.createChatWindow()
    this.createButton()
    this.addEventListeners()
  }

  private createContainer(): void {
    this.container = document.createElement('div')
    this.container.id = 'maya-chatbot-widget'
    this.container.setAttribute('data-integration', this.config.botIntegrationId)
    this.container.style.position = 'fixed'
    this.container.style.bottom = this.config.position.bottom
    this.container.style.right = this.config.position.right
    this.container.style.zIndex = String(this.config.zIndex)
    this.container.style.pointerEvents = 'auto'
    document.body.appendChild(this.container)
  }

  private getRemoteConfigUrl(): string {
    const { baseUrl, botIntegrationId } = this.config
    const trimmedBase = baseUrl.replace(/\/$/, '')
    return `${trimmedBase}/api/website-widget/configuration/${encodeURIComponent(botIntegrationId)}`
  }

  private async tryFetchRemoteConfig(): Promise<void> {
    if (!this.config.fetchRemoteConfig) return
    try {
      const response = await fetch(this.getRemoteConfigUrl(), {
        headers: { Accept: 'application/json' }
      })
      if (!response.ok) return
      const payload: { data?: RemoteWidgetConfig } = await response.json()
      const remote = payload?.data
      if (!remote) return
      if (typeof remote.hideBranding === 'boolean') {
        this.config.hideBranding = remote.hideBranding
      }
      if (remote.buttonType) {
        this.buttonVariant = remote.buttonType
        this.config.buttonVariant = remote.buttonType
      }
      if (remote.buttonImageUrl) {
        this.config.buttonImageUrl = remote.buttonImageUrl
      }
      if (remote.colors) {
        this.config.colors = {
          primary: remote.colors.primary ?? this.config.colors.primary,
          iconFill: remote.colors.iconFill ?? this.config.colors.iconFill,
          background: remote.colors.background ?? this.config.colors.background
        }
      }
      if (remote.size) {
        this.config.size = {
          width: remote.size.width ?? this.config.size.width,
          height: remote.size.height ?? this.config.size.height
        }
      }
    } catch (error) {
      console.warn('[Maya Widget] Failed to fetch remote configuration', error)
    }
  }

  private injectStyles(): void {
    const existing = document.getElementById(STYLE_TAG_ID)
    if (existing) existing.remove()

    const style = document.createElement('style')
    style.id = STYLE_TAG_ID
    style.textContent = this.buildStyleSheet()
    document.head.appendChild(style)
  }

  private buildStyleSheet(): string {
    const { colors, size, position, zIndex } = this.config
    const buttonSelector = '#maya-chatbot-widget .maya-chatbot-button'
    const windowSelector = '#maya-chatbot-widget .maya-chatbot-window'
    const headerSelector = '#maya-chatbot-widget .maya-chatbot-header'
    const closeSelector = '#maya-chatbot-widget .maya-chatbot-close'

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
    `

    const tertiary = this.buttonVariant === 'live_agent' ? this.buildLiveAgentStyles(buttonSelector) : ''

    return `${baseStyles}\n${tertiary}`
  }

  private buildLiveAgentStyles(selector: string): string {
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
    `
  }

  private createChatWindow(): void {
    if (!this.container) return
    this.chatWindow = document.createElement('div')
    this.chatWindow.className = 'maya-chatbot-window'

    this.ensureViewportMetaTag()

    // Header with close button for reliable closing on mobile
    this.chatHeader = document.createElement('div')
    this.chatHeader.className = 'maya-chatbot-header'
    this.closeBtn = document.createElement('button')
    this.closeBtn.type = 'button'
    this.closeBtn.className = 'maya-chatbot-close'
    this.closeBtn.setAttribute('aria-label', 'Close chat')
    this.closeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
    this.closeBtn.addEventListener('click', () => this.close())
    this.chatHeader.appendChild(this.closeBtn)

    this.iframe = document.createElement('iframe')
    this.iframe.className = 'maya-chatbot-iframe'
    this.iframe.src = this.resolveChatUrl()
    this.iframe.allow = 'microphone; camera'
    this.iframe.title = 'Maya chat'
    this.chatWindow.appendChild(this.chatHeader)
    this.chatWindow.appendChild(this.iframe)

    if (!this.config.hideBranding) {
      const footer = document.createElement('div')
      footer.className = 'maya-chatbot-footer'
      const referrer = encodeURIComponent(window.location.hostname)
      footer.innerHTML = `Powered by <a href="https://supmaya.com?ref=${referrer}" target="_blank" rel="noopener">Maya</a>`
      this.chatWindow.appendChild(footer)
    }

    this.container.appendChild(this.chatWindow)
  }

  private createButton(): void {
    if (!this.container) return
    this.chatButton = document.createElement('button')
    this.chatButton.type = 'button'
    this.chatButton.className = 'maya-chatbot-button'
    this.chatButton.setAttribute('aria-label', 'Open chat window')
    this.chatButton.innerHTML = this.buildButtonContent()
    this.chatButton.addEventListener('click', () => this.toggle())
    this.container.appendChild(this.chatButton)
  }

  private buildButtonContent(): string {
    if (this.buttonVariant === 'live_agent') {
      const imageUrl = this.config.buttonImageUrl ?? `${this.config.baseUrl}/assets/live-agent.png`
      return `<img src="${imageUrl}" alt="Chat with us" />`
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
    `
  }

  private ensureViewportMetaTag(): void {
    const metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1'
      document.head.appendChild(meta)
    }
  }

  private resolveChatUrl(): string {
    const { baseUrl, botIntegrationId } = this.config
    const trimmedBase = baseUrl.replace(/\/$/, '')
    return `${trimmedBase}/bots/${encodeURIComponent(botIntegrationId)}/chat`
  }

  private addEventListeners(): void {
    this.resizeHandler = () => this.handleResize()
    window.addEventListener('resize', this.resizeHandler, { passive: true })

    this.viewportHandler = () => this.handleResize()
    window.addEventListener('orientationchange', this.viewportHandler)
  }

  private removeEventListeners(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = undefined
    }
    if (this.viewportHandler) {
      window.removeEventListener('orientationchange', this.viewportHandler)
      this.viewportHandler = undefined
    }
  }

  private handleResize(): void {
    if (!this.chatWindow) return
    const isMobile = window.matchMedia('(max-width: 600px)').matches
    if (isMobile) {
      this.chatWindow.classList.add('mobile')
    } else {
      this.chatWindow.classList.remove('mobile')
    }
  }

  private resetViewportAdjustments(): void {
    if (!this.chatWindow) return
    this.chatWindow.classList.remove('mobile')
  }
}

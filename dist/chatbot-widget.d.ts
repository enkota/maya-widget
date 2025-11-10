export interface WidgetPosition {
    bottom?: string;
    right?: string;
}
export interface WidgetSize {
    width?: string;
    height?: string;
}
export interface WidgetColors {
    primary?: string;
    iconFill?: string;
    background?: string;
}
export interface ChatbotWidgetOptions {
    botIntegrationId: string;
    baseUrl?: string;
    position?: WidgetPosition;
    size?: WidgetSize;
    colors?: WidgetColors;
    hideBranding?: boolean;
    zIndex?: number;
    buttonVariant?: ButtonVariant;
    buttonImageUrl?: string;
}
type ButtonVariant = 'classic' | 'live_agent';
export default class ChatbotWidget {
    private readonly config;
    private container;
    private chatWindow;
    private closeBtn;
    private chatButton;
    private iframe;
    private isOpen;
    private buttonVariant;
    private resizeHandler?;
    private viewportHandler?;
    constructor(options: ChatbotWidgetOptions);
    open(): void;
    close(): void;
    toggle(): void;
    destroy(): void;
    private resolveOptions;
    private bootstrap;
    private createContainer;
    private injectStyles;
    private buildStyleSheet;
    private buildLiveAgentStyles;
    private createChatWindow;
    private createButton;
    private buildButtonContent;
    private ensureViewportMetaTag;
    private resolveChatUrl;
    private addEventListeners;
    private removeEventListeners;
    private handleResize;
    private resetViewportAdjustments;
}
export {};

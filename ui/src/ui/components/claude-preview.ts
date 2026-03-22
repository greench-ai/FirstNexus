/**
 * NexusClaw — ClaudePreview custom element (Lit)
 * Mirrors ClaudePreview.svelte functionality as a native web component.
 * Shows live streaming response with token count, model, and thinking level.
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("claude-preview")
export class ClaudePreview extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .claude-preview {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      width: 320px;
      max-height: 220px;
      overflow: hidden;
      background: var(--nc-surface, #1a1a2e);
      border: 1px solid var(--nc-border, #00ff88);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-family: var(--nc-font-mono, monospace);
      font-size: 0.75rem;
      color: var(--nc-text, #e0e0e0);
      z-index: 9999;
      box-shadow: 0 4px 24px rgba(0,255,136,0.12);
      transition: opacity 0.2s;
    }
    .claude-preview--hidden { opacity: 0; pointer-events: none; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.65rem;
      opacity: 0.7;
    }
    .dot {
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #666;
      margin-right: 0.4rem;
    }
    .dot--streaming { background: #00ff88; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
    .text {
      max-height: 140px;
      overflow: hidden;
      word-break: break-word;
      white-space: pre-wrap;
      opacity: 0.9;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 0.5rem;
      opacity: 0.5;
      font-size: 0.6rem;
    }
  `;

  @property() gatewayWsUrl: string = "ws://localhost:19789/ws";
  @property({ type: Boolean }) visible: boolean = true;

  @state() private streaming = false;
  @state() private currentText = "";
  @state() private model = "";
  @state() private tokenCount = 0;

  private ws: WebSocket | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._connect();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ws?.close();
  }

  private _connect() {
    try {
      this.ws = new WebSocket(this.gatewayWsUrl);
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === "agent_stream_start") {
            this.streaming = true;
            this.currentText = "";
            this.tokenCount = 0;
            this.model = msg.model ?? "";
          } else if (msg.type === "agent_stream_delta") {
            this.streaming = true;
            this.currentText += msg.delta ?? "";
            this.tokenCount = msg.tokenCount ?? this.tokenCount;
          } else if (msg.type === "agent_stream_end") {
            this.streaming = false;
            this.tokenCount = msg.tokenCount ?? this.tokenCount;
          }
        } catch { /* ignore non-JSON */ }
      };
      this.ws.onclose = () => {
        this.streaming = false;
        // Reconnect after 5s
        setTimeout(() => this._connect(), 5000);
      };
    } catch { /* WebSocket not available */ }
  }

  override render() {
    if (!this.visible || (!this.streaming && !this.currentText)) return html``;
    return html`
      <div class="claude-preview ${!this.visible ? "claude-preview--hidden" : ""}">
        <div class="header">
          <span>
            <span class="dot ${this.streaming ? "dot--streaming" : ""}"></span>
            ${this.model || "NexusClaw"}
          </span>
          <span>${this.streaming ? "streaming…" : "done"}</span>
        </div>
        <div class="text">${this.currentText.slice(-400)}</div>
        <div class="footer">
          <span>tokens: ${this.tokenCount}</span>
          <span>ws: ${this.gatewayWsUrl}</span>
        </div>
      </div>
    `;
  }
}

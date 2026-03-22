import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { titleForTab, type Tab } from "../navigation.js";

@customElement("dashboard-header")
export class DashboardHeader extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property() tab: Tab = "overview";

  override connectedCallback() {
    super.connectedCallback();
    // Wire ThemeSwitcher into #theme-switcher slot
    import("../../../themes/switcher.js")
      .then(({ ThemeSwitcher }) => {
        ThemeSwitcher.init();
        ThemeSwitcher.mount("#theme-switcher");
      })
      .catch(() => {
        // ThemeSwitcher not available — skip gracefully
      });
  }

  override render() {
    const label = titleForTab(this.tab);

    return html`
      <div class="dashboard-header">
        <div class="dashboard-header__breadcrumb">
          <span
            class="dashboard-header__breadcrumb-link"
            @click=${() => this.dispatchEvent(new CustomEvent("navigate", { detail: "overview", bubbles: true, composed: true }))}
          >
            NexusClaw
          </span>
          <span class="dashboard-header__breadcrumb-sep">›</span>
          <span class="dashboard-header__breadcrumb-current">${label}</span>
        </div>
        <div class="dashboard-header__actions">
          <div id="theme-switcher"></div>
          <slot></slot>
        </div>
      </div>
    `;
  }
}

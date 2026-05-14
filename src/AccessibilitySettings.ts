export interface AccessibilitySettingsState {
  highContrast: boolean;
  reducedMotion: boolean;
  largeHUD: boolean;
}

const SETTINGS_KEY = "dino_accessibility";

export class AccessibilitySettings {
  state: AccessibilitySettingsState;

  constructor() {
    this.state = {
      highContrast: firstRunPreference("(prefers-contrast: more)"),
      reducedMotion: firstRunPreference("(prefers-reduced-motion: reduce)"),
      largeHUD: false,
    };
    this.load();
  }

  toggle(key: keyof AccessibilitySettingsState): void {
    this.state[key] = !this.state[key];
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<AccessibilitySettingsState>;
      this.state = {
        ...this.state,
        highContrast: saved.highContrast ?? this.state.highContrast,
        reducedMotion: saved.reducedMotion ?? this.state.reducedMotion,
        largeHUD: saved.largeHUD ?? this.state.largeHUD,
      };
    } catch {}
  }

  save(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.state));
    } catch {}
  }
}

function firstRunPreference(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia?.(query).matches === true;
}

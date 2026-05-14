import { AudioManager } from "./Audio.js";

type SpeechTone = "normal" | "danger" | "relief";

export class Announcer {
  private assertiveRegion: HTMLElement | null;
  private politeRegion: HTMLElement | null;

  constructor(private audio: AudioManager) {
    this.assertiveRegion = document.getElementById("sr-assertive");
    this.politeRegion = document.getElementById("sr-polite");
  }

  assertive(message: string): void {
    this.write(this.assertiveRegion, message);
  }

  polite(message: string): void {
    this.write(this.politeRegion, message);
  }

  speak(message: string, tone: SpeechTone = "normal"): void {
    if (this.audio.isMuted() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    if (tone === "danger") {
      utterance.rate = 1.1;
      utterance.pitch = 0.85;
    } else if (tone === "relief") {
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
    } else {
      utterance.rate = 1;
      utterance.pitch = 1;
    }
    window.speechSynthesis.speak(utterance);
  }

  private write(region: HTMLElement | null, message: string): void {
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 20);
  }
}

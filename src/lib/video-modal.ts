// src/lib/video-modal.ts — adapted verbatim from animation/video-modal.ts.
// Vanilla-TS YouTube modal: the iframe is created on open and removed on
// close (which stops the audio). All listeners hang off one AbortController
// so destroy() detaches everything. No top-level DOM access — safe to import
// during the SSR/prerender pass (only the constructor touches document, and
// the app only constructs it inside a client-side useEffect).

export interface VideoModalOptions {
  /** YouTube video ID, e.g. "joNvksc8yME" */
  videoId: string;
  /** Selector for the element(s) that open the modal when clicked */
  triggerSelector: string;
  /** Autoplay when the modal opens (default: true) */
  autoplay?: boolean;
}

export class VideoModal {
  private readonly videoId: string;
  private readonly autoplay: boolean;
  private readonly triggerSelector: string;
  private overlay: HTMLDivElement | null = null;
  private readonly abortController = new AbortController();
  private lastFocused: HTMLElement | null = null;

  constructor(options: VideoModalOptions) {
    this.videoId = options.videoId;
    this.autoplay = options.autoplay ?? true;
    this.triggerSelector = options.triggerSelector;

    // Capture phase on document = runs before any other click handler,
    // so we can reliably intercept the click on the trigger.
    document.addEventListener('click', this.handleClick, {
      capture: true,
      signal: this.abortController.signal,
    });
    document.addEventListener('keydown', this.handleKeydown, {
      signal: this.abortController.signal,
    });
  }

  private handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest(this.triggerSelector)) return;
    event.preventDefault();
    event.stopPropagation();
    this.open();
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen()) this.close();
  };

  public isOpen(): boolean {
    return this.overlay?.classList.contains('is-open') ?? false;
  }

  public open(): void {
    if (!this.overlay) this.buildDom();
    if (!this.overlay) return;

    this.lastFocused = document.activeElement as HTMLElement | null;

    const frame = this.overlay.querySelector<HTMLDivElement>('.video-modal__frame');
    if (frame) {
      const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
      if (this.autoplay) params.set('autoplay', '1');
      frame.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${this.videoId}?${params.toString()}"
          title="YouTube video player"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowfullscreen></iframe>`;
    }

    document.body.classList.add('video-modal-open');
    // double rAF so the .is-open transition actually animates from the start state
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.overlay?.classList.add('is-open'))
    );
    this.overlay.querySelector<HTMLButtonElement>('.video-modal__close')?.focus();
  }

  public close(): void {
    if (!this.overlay || !this.isOpen()) return;
    this.overlay.classList.remove('is-open');
    document.body.classList.remove('video-modal-open');

    // Removing the iframe stops the audio; wait until the fade-out ends
    window.setTimeout(() => {
      const frame = this.overlay?.querySelector<HTMLDivElement>('.video-modal__frame');
      if (frame) frame.innerHTML = '';
    }, 350);

    this.lastFocused?.focus();
  }

  private buildDom(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'video-modal-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'YouTube video');

    const modal = document.createElement('div');
    modal.className = 'video-modal';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'video-modal__close';
    closeBtn.setAttribute('aria-label', 'Close video');
    closeBtn.innerHTML = '&times;';

    const frame = document.createElement('div');
    frame.className = 'video-modal__frame';

    modal.append(closeBtn, frame);
    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    closeBtn.addEventListener('click', () => this.close(), {
      signal: this.abortController.signal,
    });
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.close(); // click on dark area closes
    }, { signal: this.abortController.signal });
  }

  public destroy(): void {
    this.abortController.abort(); // detaches every listener
    this.overlay?.remove();
    this.overlay = null;
    document.body.classList.remove('video-modal-open');
  }
}

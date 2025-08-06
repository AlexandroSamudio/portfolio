import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconService, IconLoadResult } from '../../services/icon.service';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [innerHTML]="iconContent()"
      [attr.aria-label]="ariaLabel()"
      [class]="cssClasses()"
      role="img"
    >
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  private readonly iconService = inject(IconService);
  private destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly nameSignal = signal<string>('');
  private readonly sizeSignal = signal<string>('w-4 h-4');
  private readonly loadingTextSignal = signal<string>('Loading icon...');
  private readonly errorTextSignal = signal<string>('Icon failed to load');

  private readonly iconResultSignal = signal<IconLoadResult | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);

  readonly iconContent = computed<SafeHtml>(() => {
    const result = this.iconResultSignal();
    return result?.content ?? this.getLoadingIcon();
  });

  readonly ariaLabel = computed<string>(() => {
    const name = this.nameSignal();
    const result = this.iconResultSignal();

    if (this.isLoadingSignal()) {
      return this.loadingTextSignal();
    }

    if (result && !result.success) {
      return this.errorTextSignal();
    }

    return name ? `${name} icon` : 'Tech icon';
  });

  readonly cssClasses = computed<string>(() => {
    const baseClasses = this.sizeSignal();
    const isLoading = this.isLoadingSignal();
    const result = this.iconResultSignal();

    let classes = baseClasses;

    if (isLoading) {
      classes += ' animate-pulse opacity-50';
    } else if (result && !result.success) {
      classes += ' opacity-60';
    }

    return classes;
  });

  constructor() {
    effect(() => {
      const name = this.nameSignal();
      if (name) {
        this.loadIcon(name);
      }
    });
  }

  @Input()
  set name(value: string) {
    this.nameSignal.set(value || '');
  }

  get name(): string {
    return this.nameSignal();
  }

  @Input()
  set size(value: string) {
    this.sizeSignal.set(value || 'w-4 h-4');
  }

  get size(): string {
    return this.sizeSignal();
  }

  @Input()
  set loadingText(value: string) {
    this.loadingTextSignal.set(value || 'Loading icon...');
  }

  get loadingText(): string {
    return this.loadingTextSignal();
  }

  @Input()
  set errorText(value: string) {
    this.errorTextSignal.set(value || 'Icon failed to load');
  }

  get errorText(): string {
    return this.errorTextSignal();
  }

  private loadIcon(iconName: string): void {
    this.isLoadingSignal.set(true);
    this.iconResultSignal.set(null);

    this.iconService
      .loadIcon(iconName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: IconLoadResult) => {
          this.iconResultSignal.set(result);
          this.isLoadingSignal.set(false);
        },
        error: (error) => {
          console.warn(`Failed to load icon '${iconName}':`, error);
          this.iconResultSignal.set({
            success: false,
            content: this.getErrorIcon(),
            error: error.message || 'Unknown error',
          });
          this.isLoadingSignal.set(false);
        },
      });
  }

  private getLoadingIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg class="animate-spin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
      </svg>
    `);
  }

  private getErrorIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#EF4444" opacity="0.8"/>
        <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `);
  }
}

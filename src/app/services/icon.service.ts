import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { of, Observable, combineLatest, Subscription } from 'rxjs';
import { TECH_ICONS } from '../constants/tech-icons';

export interface TechIcon {
  readonly name: string;
  readonly fileName: string;
  readonly category: TechIconCategory;
  readonly displayName?: string;
}

export type TechIconCategory = 'frontend' | 'backend' | 'database' | 'tools';

export interface IconLoadResult {
  readonly success: boolean;
  readonly content: SafeHtml;
  readonly error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IconService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly iconCache = new Map<string, Observable<IconLoadResult>>();
  private preloadSubscription: Subscription | null = null;

  private readonly loadedIconsSignal = signal<Set<string>>(new Set());
  private readonly loadingIconsSignal = signal<Set<string>>(new Set());
  private readonly failedIconsSignal = signal<Set<string>>(new Set());

  private readonly techIconsConfig: ReadonlyArray<TechIcon> = [
    // UI/Skill category icons
    {
      name: 'web',
      fileName: 'web.svg',
      category: 'frontend',
      displayName: 'Web',
    },
    {
      name: 'code',
      fileName: 'code.svg',
      category: 'backend',
      displayName: 'Code',
    },
    {
      name: 'database',
      fileName: 'database.svg',
      category: 'database',
      displayName: 'Database',
    },
    {
      name: 'tools',
      fileName: 'tools.svg',
      category: 'tools',
      displayName: 'Tools',
    },

    // Frontend Technologies
    { name: 'Angular', fileName: 'angular.svg', category: 'frontend' },
    { name: 'TypeScript', fileName: 'typescript.svg', category: 'frontend' },
    { name: 'JavaScript', fileName: 'javascript.svg', category: 'frontend' },
    { name: 'HTML5', fileName: 'html5.svg', category: 'frontend' },
    { name: 'CSS3', fileName: 'css3.svg', category: 'frontend' },
    {
      name: 'Tailwind CSS',
      fileName: 'tailwind-css.svg',
      category: 'frontend',
      displayName: 'Tailwind CSS',
    },

    // Backend Technologies
    {
      name: '.NET',
      fileName: 'dotnet.svg',
      category: 'backend',
      displayName: '.NET',
    },
    {
      name: 'ASP.NET Core',
      fileName: 'aspnet-core.svg',
      category: 'backend',
      displayName: 'ASP.NET Core',
    },
    {
      name: 'C#',
      fileName: 'csharp.svg',
      category: 'backend',
      displayName: 'C#',
    },
    {
      name: 'Entity Framework',
      fileName: 'entity-framework.svg',
      category: 'backend',
    },
    { name: 'JWT', fileName: 'jwt.svg', category: 'backend' },

    // Database Technologies
    { name: 'PostgreSQL', fileName: 'postgresql.svg', category: 'database' },
    { name: 'MySQL', fileName: 'mysql.svg', category: 'database' },
    {
      name: 'SQL Server',
      fileName: 'sql-server.svg',
      category: 'database',
      displayName: 'SQL Server',
    },
    { name: 'Firebase', fileName: 'firebase.svg', category: 'database' },

    // Tools
    { name: 'Git', fileName: 'git.svg', category: 'tools' },
    { name: 'Github', fileName: 'github.svg', category: 'tools' },
    {
      name: 'GitHub Actions',
      fileName: 'github-actions.svg',
      category: 'tools',
      displayName: 'GitHub Actions',
    },
    {
      name: 'CI/CD',
      fileName: 'cicd.svg',
      category: 'tools',
      displayName: 'CI/CD',
    },
  ] as const;

  readonly availableIcons = computed(() => this.techIconsConfig);
  readonly loadedIcons = computed(() => this.loadedIconsSignal());
  readonly loadingIcons = computed(() => this.loadingIconsSignal());
  readonly failedIcons = computed(() => this.failedIconsSignal());

  readonly iconsByCategory = computed(() => {
    const categories = new Map<TechIconCategory, ReadonlyArray<TechIcon>>();
    for (const icon of this.techIconsConfig) {
      const existing = categories.get(icon.category) || [];
      categories.set(icon.category, [...existing, icon]);
    }
    return categories;
  });

  initialize(): void {
    this.preloadTechIcons();
  }

  preloadTechIcons(): void {
    this.unsubscribePreload();

    this.preloadSubscription = this.preloadIcons(TECH_ICONS).subscribe({
      next: () => {},
      error: (err) => {
        console.warn('Error preloading some technology icons:', err);
      },
    });
  }

  private unsubscribePreload(): void {
    if (this.preloadSubscription) {
      this.preloadSubscription.unsubscribe();
      this.preloadSubscription = null;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribePreload();
    this.clearCache();
  }

  loadIcon(iconName: string): Observable<IconLoadResult> {
    const normalizedName = this.normalizeIconName(iconName);
    console.log(
      `IconService: Loading icon '${iconName}' (normalized: '${normalizedName}')`
    );

    if (this.iconCache.has(normalizedName)) {
      console.log(`IconService: Icon '${normalizedName}' found in cache`);
      return this.iconCache.get(normalizedName)!;
    }

    const iconConfig = this.findIconConfig(normalizedName);
    if (!iconConfig) {
      console.warn(`IconService: Icon '${iconName}' not found in config`);
      const errorResult = this.createErrorResult(
        `Icon '${iconName}' not found`
      );
      this.iconCache.set(normalizedName, of(errorResult));
      return of(errorResult);
    }

    console.log(
      `IconService: Found icon config for '${normalizedName}':`,
      iconConfig
    );
    this.updateLoadingState(normalizedName, true);

    const iconPath = `/assets/icons/${iconConfig.fileName}`;
    console.log(`IconService: Fetching icon from path: ${iconPath}`);

    const iconObservable = this.http
      .get(iconPath, { responseType: 'text' })
      .pipe(
        map((svgContent: string) => {
          console.log(
            `IconService: Successfully loaded SVG content for '${normalizedName}'`,
            svgContent.substring(0, 100) + '...'
          );
          return this.createSuccessResult(svgContent);
        }),
        catchError((error) => {
          console.warn(
            `IconService: Failed to load icon '${iconName}' from '${iconPath}':`,
            error
          );
          return of(
            this.createErrorResult(`Failed to load icon: ${error.message}`)
          );
        }),
        map((result) => {
          this.updateLoadingState(normalizedName, false);
          if (result.success) {
            this.updateLoadedState(normalizedName, true);
          } else {
            this.updateFailedState(normalizedName, true);
          }
          return result;
        }),
        shareReplay(1)
      );

    this.iconCache.set(normalizedName, iconObservable);
    return iconObservable;
  }

  preloadIcons(iconNames: string[]): Observable<IconLoadResult[]> {
    if (iconNames.length === 0) {
      return of([]);
    }

    const loadObservables = iconNames.map((name) =>
      this.loadIcon(name).pipe(
        catchError(() =>
          of(this.createErrorResult(`Failed to preload ${name}`))
        )
      )
    );

    return combineLatest(loadObservables);
  }

  getIconConfig(iconName: string): TechIcon | undefined {
    return this.findIconConfig(this.normalizeIconName(iconName));
  }

  isIconAvailable(iconName: string): boolean {
    return this.findIconConfig(this.normalizeIconName(iconName)) !== undefined;
  }

  getIconsByCategory(category: TechIconCategory): ReadonlyArray<TechIcon> {
    return this.iconsByCategory().get(category) || [];
  }

  clearCache(): void {
    this.iconCache.clear();
    this.loadedIconsSignal.set(new Set());
    this.loadingIconsSignal.set(new Set());
    this.failedIconsSignal.set(new Set());
  }

  private normalizeIconName(name: string): string {
    return name.trim();
  }

  private findIconConfig(normalizedName: string): TechIcon | undefined {
    return this.techIconsConfig.find(
      (config) =>
        config.name === normalizedName || config.displayName === normalizedName
    );
  }

  private createSuccessResult(svgContent: string): IconLoadResult {
    return {
      success: true,
      content: this.sanitizer.bypassSecurityTrustHtml(svgContent),
    };
  }

  private createErrorResult(error: string): IconLoadResult {
    const fallbackSvg = `
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-label="Icon not found">
        <circle cx="12" cy="12" r="8" fill="#6B7280"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="8">?</text>
      </svg>
    `;

    return {
      success: false,
      content: this.sanitizer.bypassSecurityTrustHtml(fallbackSvg),
      error,
    };
  }

  private updateSignalSet<T>(
    signalFn: ReturnType<typeof signal<Set<T>>>,
    itemName: T,
    addItem: boolean
  ): void {
    const currentSet = signalFn();
    const newSet = new Set(currentSet);

    if (addItem) {
      newSet.add(itemName);
    } else {
      newSet.delete(itemName);
    }

    signalFn.set(newSet);
  }

  private updateLoadingState(iconName: string, isLoading: boolean): void {
    this.updateSignalSet(this.loadingIconsSignal, iconName, isLoading);
  }

  private updateLoadedState(iconName: string, isLoaded: boolean): void {
    this.updateSignalSet(this.loadedIconsSignal, iconName, isLoaded);
  }

  private updateFailedState(iconName: string, hasFailed: boolean): void {
    this.updateSignalSet(this.failedIconsSignal, iconName, hasFailed);
  }
}

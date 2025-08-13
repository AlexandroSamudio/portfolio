import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { translations } from './translations';
import { IconComponent } from './icon.component';
import { ICON_NAMES, IconName } from '../../constants/icon-names';
import { IconService } from '../../services/icon.service';

interface StarfieldElement {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'slow' | 'medium' | 'fast' | 'purple' | 'particle';
  opacity: number;
  twinkleSpeed?: number;
  color?: string;
  animationOffset?: number;
}

interface NavigationItem {
  id: 'about' | 'skills' | 'projects' | 'contact';
  label: string;
}

interface SocialLink {
  icon: string;
  label: string;
  color: string;
  href: string;
}

interface Skill {
  icon: string;
  name: string;
  description: string;
  technologies: IconName[];
  color: string;
}

interface Project {
  title: string;
  description: string;
  video: string;
  image: string;
  technologies: IconName[];
  codeUrl: string;
  demoUrl: string;
}

interface SocialLinkConfig {
  icon: string;
  labelKey: string;
  color: string;
  href: string;
}

interface SkillConfig {
  icon: string;
  nameKey: string;
  descriptionKey: string;
  technologies: IconName[];
  color: string;
}

interface ProjectConfig {
  titleKey: string;
  descriptionKey: string;
  video: string;
  image: string;
  technologies: IconName[];
  codeUrl: string;
  demoUrl: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  imports: [CommonModule, IconComponent],
  styleUrls: ['./main.css'],
})
export class Main implements OnInit, AfterViewInit, OnDestroy {
  private iconService = inject(IconService);

  public hoveredProjectIndex: number | null = null;
  public currentLanguage: 'es' | 'en' = 'es';
  public projects: Project[] = [];
  public skills: Skill[] = [];
  public socialLinks: SocialLink[] = [];
  public navigationItems: NavigationItem[] = [];
  private readonly contactEmail = 'alex75221@gmail.com';
  private boundHandleResize = this.handleResize.bind(this);

  @ViewChild('starfieldCanvas') starfieldCanvas!: ElementRef<HTMLCanvasElement>;
  private canvasContext!: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private animationFrameId?: number;
  private starfieldElements: StarfieldElement[] = [];

  currentYear = new Date().getFullYear();
  translations = translations;

  typedText = '';
  caretVisible = true;
  private typingIsDeleting = false;
  private typingWordIndex = 0;
  private typingCharIndex = 0;
  private typingIntervalId?: number;
  private caretIntervalId?: number;
  private typingWords: string[] = [];

  @ViewChildren('projectVideo') projectVideos!: QueryList<
    ElementRef<HTMLVideoElement>
  >;

  private readonly socialLinksConfig: SocialLinkConfig[] = [
    {
      icon: 'github',
      labelKey: 'social.github',
      color: 'cyan',
      href: 'https://github.com/AlexandroSamudio',
    },
    {
      icon: 'linkedin',
      labelKey: 'social.linkedin',
      color: 'purple',
      href: 'https://www.linkedin.com/in/alexandro-samudio-b40b76289/',
    },
    {
      icon: 'PDF',
      labelKey: 'social.contact',
      color: 'pink',
      href: 'sample.pdf',
    },
  ];

  private readonly skillsConfig: SkillConfig[] = [
    {
      icon: 'web',
      nameKey: 'skills.frontend.name',
      descriptionKey: 'skills.frontend.description',
      technologies: [
        ICON_NAMES.ANGULAR,
        ICON_NAMES.TYPESCRIPT,
        ICON_NAMES.HTML5,
        ICON_NAMES.CSS3,
        ICON_NAMES.TAILWIND_CSS,
        ICON_NAMES.JAVASCRIPT,
      ],
      color: 'cyan',
    },
    {
      icon: 'code',
      nameKey: 'skills.backend.name',
      descriptionKey: 'skills.backend.description',
      technologies: [
        ICON_NAMES.ASPNET_CORE,
        ICON_NAMES.CSHARP,
        ICON_NAMES.ENTITY_FRAMEWORK,
        ICON_NAMES.JWT,
      ],
      color: 'purple',
    },
    {
      icon: 'database',
      nameKey: 'skills.database.name',
      descriptionKey: 'skills.database.description',
      technologies: [
        ICON_NAMES.POSTGRESQL,
        ICON_NAMES.MYSQL,
        ICON_NAMES.FIREBASE,
        ICON_NAMES.SQL_SERVER,
      ],
      color: 'blue',
    },
    {
      icon: 'tools',
      nameKey: 'skills.tools.name',
      descriptionKey: 'skills.tools.description',
      technologies: [
        ICON_NAMES.GITHUB,
        ICON_NAMES.GITHUB_ACTIONS,
        ICON_NAMES.CICD,
        ICON_NAMES.GIT,
      ],
      color: 'green',
    },
  ];

  private readonly projectsConfig: ProjectConfig[] = [
    {
      titleKey: 'projects.kiosco.title',
      descriptionKey: 'projects.kiosco.description',
      video: 'kiosco-manager.mp4',
      image: 'kiosco-manager.png',
      technologies: [
        ICON_NAMES.ANGULAR,
        ICON_NAMES.TYPESCRIPT,
        ICON_NAMES.DOTNET,
        ICON_NAMES.POSTGRESQL,
        ICON_NAMES.JWT,
      ],
      codeUrl: 'https://github.com/AlexandroSamudio/KioscoManager',
      demoUrl: 'https://kioscomanager.com',
    },
    {
      titleKey: 'projects.clinica.title',
      descriptionKey: 'projects.clinica.description',
      video: 'clinica-online.mp4',
      image: 'clinica-online.png',
      technologies: [
        ICON_NAMES.ANGULAR,
        ICON_NAMES.TYPESCRIPT,
        ICON_NAMES.FIREBASE,
      ],
      codeUrl: 'https://github.com/AlexandroSamudio/ClinicaOnline2024',
      demoUrl: 'https://clinicaonline-1db72.firebaseapp.com',
    },
  ];

  setHoveredProjectIndex(index: number | null): void {
    this.hoveredProjectIndex = index;
    try {
      this.projectVideos?.forEach((v) => v.nativeElement.pause());
    } catch {}

    if (index !== null) {
      setTimeout(() => {
        const videoElement = this.projectVideos.toArray()[index]?.nativeElement;
        if (videoElement) {
          try {
            this.setupVideo(videoElement);
            this.playVideo(videoElement);
          } catch (error) {
            console.error('Error al reproducir el video:', error);
          }
        }
      }, 0);
    }
  }

  getText(key: string): string {
    const languageTexts = this.translations[this.currentLanguage] as {
      [key: string]: string;
    };
    return languageTexts[key] || key;
  }

  private updateTextBasedProperties(): void {
    this.navigationItems = [
      { id: 'about', label: this.getText('nav.about') },
      { id: 'skills', label: this.getText('nav.skills') },
      { id: 'projects', label: this.getText('nav.projects') },
      { id: 'contact', label: this.getText('nav.contact') },
    ];

    this.socialLinks = this.socialLinksConfig.map((config) => ({
      icon: config.icon,
      label: this.getText(config.labelKey),
      color: config.color,
      href: config.href,
    }));

    this.skills = this.skillsConfig.map((config) => ({
      icon: config.icon,
      name: this.getText(config.nameKey),
      description: this.getText(config.descriptionKey),
      technologies: config.technologies,
      color: config.color,
    }));

    this.projects = this.projectsConfig.map((config) => ({
      title: this.getText(config.titleKey),
      description: this.getText(config.descriptionKey),
      video: config.video,
      image: config.image,
      technologies: config.technologies,
      codeUrl: config.codeUrl,
      demoUrl: config.demoUrl,
    }));
  }

  ngOnInit() {
    this.iconService.initialize();

    try {
      const savedLanguage = localStorage.getItem('portfolio-language');
      if (savedLanguage === 'es' || savedLanguage === 'en') {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.warn('No se pudo accerder', error);
    }
    this.updateTextBasedProperties();
    this.initTypingEffect();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.generateStarfieldElements();
    this.startCanvasAnimation();

    window.addEventListener('resize', this.boundHandleResize);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.boundHandleResize);
    this.stopTypingEffect();
  }

  private initCanvas(): void {
    const canvas = this.starfieldCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    this.canvasContext = ctx;
    this.setCanvasDimensions();
  }

  private setCanvasDimensions(): void {
    const canvas = this.starfieldCanvas.nativeElement;
    const { width, height } = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    this.canvasWidth = width;
    this.canvasHeight = height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.scale(dpr, dpr);
  }

  private handleResize(): void {
    this.setCanvasDimensions();
    this.generateStarfieldElements();
  }

  private generateStarfieldElements(): void {
    this.starfieldElements = [];

    for (let i = 0; i < 50; i++) {
      this.starfieldElements.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        speed: Math.random() * 0.3 + 0.1,
        type: 'slow',
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        animationOffset: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 30; i++) {
      this.starfieldElements.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.3,
        type: 'medium',
        opacity: Math.random() * 0.6 + 0.4,
        twinkleSpeed: Math.random() * 0.04 + 0.02,
        animationOffset: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 20; i++) {
      this.starfieldElements.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: Math.random() * 40 + 20,
        height: 2,
        speed: Math.random() * 4 + 3,
        type: 'fast',
        opacity: Math.random() * 0.3 + 0.5,
      });
    }

    for (let i = 0; i < 15; i++) {
      this.starfieldElements.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: Math.random() * 60 + 30,
        height: 1,
        speed: Math.random() * 5 + 4,
        type: 'purple',
        opacity: Math.random() * 0.3 + 0.3,
      });
    }

    for (let i = 0; i < 25; i++) {
      this.starfieldElements.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        speed: Math.random() * 0.2 + 0.1,
        type: 'particle',
        opacity: Math.random() * 0.4 + 0.3,
        color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7',
        animationOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private startCanvasAnimation(): void {
    let lastTime = 0;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - (lastTime || timestamp);
      lastTime = timestamp;

      this.updateStarfield(deltaTime);
      this.renderStarfield();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateStarfield(deltaTime: number): void {
    this.starfieldElements.forEach((element) => {
      element.x -= element.speed * (deltaTime / 16);

      if (element.x + element.width < 0) {
        element.x = this.canvasWidth;
        element.y = Math.random() * this.canvasHeight;
      }

      if (element.animationOffset !== undefined) {
        element.animationOffset +=
          (element.twinkleSpeed || 0.02) * (deltaTime / 16);
      }

      if (
        element.type === 'particle' &&
        element.animationOffset !== undefined
      ) {
        const floatY = Math.sin(element.animationOffset) * 20;
        const floatX = Math.cos(element.animationOffset) * 10;
        element.x += floatX * 0.01;
        element.y += floatY * 0.01;
      }
    });
  }

  private renderStarfield(): void {
    const ctx = this.canvasContext;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.starfieldElements.forEach((element) => {
      switch (element.type) {
        case 'slow':
          ctx.fillStyle = `rgba(255, 255, 255, ${
            element.animationOffset
              ? (Math.sin(element.animationOffset) * 0.3 + 0.7) *
                element.opacity
              : element.opacity
          })`;
          break;

        case 'medium':
          ctx.fillStyle = `rgba(103, 232, 249, ${
            element.animationOffset
              ? (Math.sin(element.animationOffset) * 0.5 + 0.5) *
                element.opacity
              : element.opacity
          })`;
          break;

        case 'fast':
          const fastGradient = ctx.createLinearGradient(
            element.x,
            element.y,
            element.x + element.width,
            element.y
          );
          fastGradient.addColorStop(0, 'rgba(103, 232, 249, 0)');
          fastGradient.addColorStop(
            0.5,
            `rgba(103, 232, 249, ${element.opacity})`
          );
          fastGradient.addColorStop(1, 'rgba(103, 232, 249, 0)');
          ctx.fillStyle = fastGradient;
          break;

        case 'purple':
          const purpleGradient = ctx.createLinearGradient(
            element.x,
            element.y,
            element.x + element.width,
            element.y
          );
          purpleGradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
          purpleGradient.addColorStop(
            0.5,
            `rgba(168, 85, 247, ${element.opacity})`
          );
          purpleGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = purpleGradient;
          break;

        case 'particle':
          const glowIntensity = element.animationOffset
            ? Math.sin(element.animationOffset) * 0.4 + 0.6
            : 1;
          ctx.fillStyle = element.color || '#22d3ee';
          ctx.globalAlpha = element.opacity * glowIntensity;
          break;
      }

      ctx.beginPath();
      this.drawRoundedRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        element.height / 2
      );
      ctx.fill();

      ctx.globalAlpha = 1;
    });
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  private setupVideo(videoElement: HTMLVideoElement): void {
    videoElement.muted = true;
    videoElement.volume = 0;
  }

  private playVideo(videoElement: HTMLVideoElement): void {
    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  trackBySocialLink(index: number, link: SocialLink): string {
    return link.href;
  }

  trackBySkill(index: number, skill: Skill): string {
    return skill.icon;
  }

  trackByProject(project: Project): string {
    return project.codeUrl || project.demoUrl || project.title;
  }

  onSocialLinkClick(link: SocialLink): void {
    window.open(link.href, '_blank', 'noopener,noreferrer');
  }

  onProjectAction(action: 'code' | 'demo', project: Project): void {
    if (action === 'code' && project.codeUrl) {
      window.open(project.codeUrl, '_blank', 'noopener,noreferrer');
    } else if (action === 'demo' && project.demoUrl) {
      window.open(project.demoUrl, '_blank', 'noopener,noreferrer');
    } else {
      if (action === 'code') {
        window.open(
          'https://github.com/AlexandroSamudio',
          '_blank',
          'noopener,noreferrer'
        );
      } else if (action === 'demo') {
        console.warn('Demo URL not available for this project');
      }
    }
  }

  onContactClick(): void {
    const email = this.contactEmail;
    const subject = 'Consulta desde Portfolio - ALEX.DEV';
    const body =
      'Hola Alex,\n\nMe pongo en contacto contigo desde tu portfolio web.\n\n';

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  toggleLanguage(): void {
    this.currentLanguage = this.currentLanguage === 'es' ? 'en' : 'es';
    localStorage.setItem('portfolio-language', this.currentLanguage);
    this.updateTextBasedProperties();
    this.initTypingEffect();
  }

  private buildTypingWords(): void {
    const keys = [
      'typing.word1',
      'typing.word2',
      'typing.word3',
      'typing.word4',
      'typing.word5',
    ];
    this.typingWords = keys
      .map((k) => this.getText(k))
      .filter((w) => typeof w === 'string' && w.length > 0);
    if (this.typingWords.length === 0) {
      this.typingWords = [''];
    }
  }

  private initTypingEffect(): void {
    this.buildTypingWords();
    this.stopTypingEffect();
    this.typedText = '';
    this.typingIsDeleting = false;
    this.typingWordIndex = 0;
    this.typingCharIndex = 0;
    this.caretIntervalId = window.setInterval(() => {
      this.caretVisible = !this.caretVisible;
    }, 500);
    this.scheduleNextType(200);
  }

  private scheduleNextType(delay: number): void {
    this.typingIntervalId = window.setTimeout(() => this.tickType(), delay);
  }

  private tickType(): void {
    const currentWord = this.typingWords[this.typingWordIndex] ?? '';
    const full = currentWord;

    if (!this.typingIsDeleting) {
      this.typedText = full.substring(0, this.typingCharIndex + 1);
      this.typingCharIndex = this.typedText.length;
    } else {
      this.typedText = full.substring(0, Math.max(0, this.typingCharIndex - 1));
      this.typingCharIndex = this.typedText.length;
    }

    let delay = this.typingIsDeleting ? 60 : 100;

    if (!this.typingIsDeleting && this.typedText === full) {
      delay = 1200;
      this.typingIsDeleting = true;
    } else if (this.typingIsDeleting && this.typedText === '') {
      this.typingIsDeleting = false;
      this.typingWordIndex =
        (this.typingWordIndex + 1) % this.typingWords.length;
      delay = 400;
    }

    this.scheduleNextType(delay);
  }

  private stopTypingEffect(): void {
    if (this.typingIntervalId !== undefined) {
      clearTimeout(this.typingIntervalId);
      this.typingIntervalId = undefined;
    }
    if (this.caretIntervalId !== undefined) {
      clearInterval(this.caretIntervalId);
      this.caretIntervalId = undefined;
    }
  }
}

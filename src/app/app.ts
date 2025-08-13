import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { Meta, Title } from '@angular/platform-browser';
import { inject as injectVercelAnalytics } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Alexandro Samudio | Portfolio';
  metaService = inject(Meta);
  titleService = inject(Title);

  constructor() {
    injectSpeedInsights();
    injectVercelAnalytics();
    this.titleService.setTitle(this.title);

    this.metaService.updateTag(
      {
        name: 'description',
        content:
          'Alexandro Samudio - Mi portafolio personal, donde comparto mis proyectos, habilidades y experiencias en desarrollo web.',
      },
      "name='description'"
    );
  }
}

export const ICON_NAMES = {
  // Frontend Technologies
  ANGULAR: 'Angular',
  TYPESCRIPT: 'TypeScript', 
  JAVASCRIPT: 'JavaScript',
  HTML5: 'HTML5',
  CSS3: 'CSS3',
  TAILWIND_CSS: 'Tailwind CSS',
  
  // Backend Technologies
  DOTNET: '.NET',
  ASPNET_CORE: 'ASP.NET Core',
  CSHARP: 'C#',
  ENTITY_FRAMEWORK: 'Entity Framework',
  JWT: 'JWT',
  
  // Database Technologies
  POSTGRESQL: 'PostgreSQL',
  MYSQL: 'MySQL',
  SQL_SERVER: 'SQL Server',
  FIREBASE: 'Firebase',
  
  // Tools & DevOps
  GIT: 'Git',
  GITHUB: 'Github',
  GITHUB_ACTIONS: 'GitHub Actions',
  CICD: 'CI/CD'
} as const;

export type IconName = typeof ICON_NAMES[keyof typeof ICON_NAMES];

export function getIconName(key: keyof typeof ICON_NAMES): IconName {
  return ICON_NAMES[key];
}

export function isValidIconName(name: string): name is IconName {
  return Object.values(ICON_NAMES).includes(name as IconName);
}

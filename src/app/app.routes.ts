import { Routes } from '@angular/router';
import { Main } from './_components/main/main';

export const routes: Routes = [
  {path: '', component: Main},
  { path: '**', redirectTo: ''}
];

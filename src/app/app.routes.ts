import { Routes } from '@angular/router';
import { Main } from './_components/main/main';

export const routes: Routes = [
  {path: '', redirectTo: 'main', pathMatch: 'full'},
  {path: 'main', component: Main},
];

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CourseDetailComponent } from './pages/course-detail/course-detail';
import { ProfileComponent } from './pages/profile/profile';
import { EventsComponent } from './pages/events/events';
import { HostDashboardComponent } from './pages/host-dashboard/host-dashboard';
import { MyLearningComponent } from './pages/my-learning/my-learning';
import { CreditsComponent } from './pages/credits/credits';
import { KnowledgeBaseComponent } from './pages/knowledge/knowledge';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'course/:id', component: CourseDetailComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'events', component: EventsComponent },
  { path: 'my-learning', component: MyLearningComponent },
  { path: 'host-dashboard', component: HostDashboardComponent },
  { path: 'credits', component: CreditsComponent },
  { path: 'knowledge', component: KnowledgeBaseComponent },
  { path: '**', redirectTo: 'login' }
];
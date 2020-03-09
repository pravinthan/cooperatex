import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./components/pages/home/home.component";
import { PageNotFoundComponent } from "./components/pages/page-not-found/page-not-found.component";
import { CreditsComponent } from "./components/pages/credits/credits.component";
import { SignInComponent } from "./components/sign-in/sign-in.component";
import { SignUpComponent } from "./components/sign-up/sign-up.component";
import { AuthenticationGuard } from "./shared/authentication.guard";
import { ProjectsComponent } from './components/pages/projects/projects.component';

const routes: Routes = [
  { path: "", pathMatch: "full", component: HomeComponent },
  { path: "signin", component: SignInComponent },
  { path: "signup", component: SignUpComponent },
  {
    path: "credits",
    component: CreditsComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: "projects",
    component: ProjectsComponent
  },
  { path: "**", component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

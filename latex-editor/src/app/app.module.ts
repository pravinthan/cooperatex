import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { FormsModule } from "@angular/forms";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { CodemirrorModule } from "@ctrl/ngx-codemirror";
import { MatCheckboxModule } from "@angular/material/checkbox";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./components/pages/home/home.component";
import { NavigationComponent } from "./components/navigation/navigation.component";
import { HeaderComponent } from "./components/header/header.component";
import { PageNotFoundComponent } from "./components/pages/page-not-found/page-not-found.component";
import { CreditsComponent } from "./components/pages/credits/credits.component";
import { SignInComponent } from "./components/sign-in/sign-in.component";
import { SignUpComponent } from "./components/sign-up/sign-up.component";
import { ProjectsComponent } from "./components/pages/projects/projects.component";
import { NewProjectDialogComponent } from "./components/pages/projects/new-project-dialog/new-project-dialog.component";

import { JwtInterceptor } from "./shared/jwt.interceptor";

import { TimeAgoPipeExtension } from "./shared/time-ago-pipe-extension.pipe";
import { DeleteProjectDialogComponent } from "./components/pages/projects/delete-project-dialog/delete-project-dialog.component";
import { ProjectComponent } from "./components/pages/project/project.component";
import { UploadFileDialogComponent } from './components/pages/project/upload-file-dialog/upload-file-dialog.component';

import "codemirror/mode/stex/stex";


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    NavigationComponent,
    PageNotFoundComponent,
    CreditsComponent,
    SignInComponent,
    SignUpComponent,
    ProjectsComponent,
    NewProjectDialogComponent,
    TimeAgoPipeExtension,
    DeleteProjectDialogComponent,
    ProjectComponent,
    UploadFileDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FormsModule,
    MatSnackBarModule,
    MatSortModule,
    MatTooltipModule,
    MatButtonToggleModule,
    CodemirrorModule,
    MatCheckboxModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

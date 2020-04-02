import { Component, OnDestroy } from "@angular/core";
import { SignInComponent } from "../sign-in/sign-in.component";
import { MatDialog } from "@angular/material/dialog";
import { SignUpComponent } from "../sign-up/sign-up.component";
import { Router, NavigationEnd, Event } from "@angular/router";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { SocketService } from "src/app/shared/socket.service";
import { Invitation } from "src/app/shared/models/invitation.model";
import { InvitationsDialogComponent } from "./invitations-dialog/invitations-dialog.component";
import { ProjectService } from "src/app/shared/project.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"]
})
export class HeaderComponent implements OnDestroy {
  currentUser = this.authenticationService.currentUser;
  invitations: Invitation[] = [];
  onInvitationChangeSubscription: Subscription;

  constructor(
    public dialog: MatDialog,
    private authenticationService: AuthenticationService,
    private router: Router,
    private socketService: SocketService,
    private projectService: ProjectService
  ) {
    // Get invitations after URL changes
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd && this.currentUser) {
        this.refreshInvitations();

        if (!this.onInvitationChangeSubscription) {
          this.onInvitationChangeSubscription = this.socketService
            .onInvitationChange()
            .subscribe(() => this.refreshInvitations());
        }
      }
    });
  }

  refreshInvitations = () => {
    this.projectService
      .getInvitations()
      .toPromise()
      .then(invitations => (this.invitations = invitations));
  };

  ngOnDestroy() {
    if (this.onInvitationChangeSubscription)
      this.onInvitationChangeSubscription.unsubscribe();
  }

  // Workaround for when the user decided to leave the session (CanDeactivate guard bugged in Angular 9)
  async leaveAllProjectSessions() {
    const projects = await this.projectService.getAllProjects().toPromise();
    projects.forEach(project => {
      this.socketService.leaveProjectSession(project._id, this.currentUser);
    });
  }

  openInvitationsDialog() {
    let dialogRef = this.dialog.open(InvitationsDialogComponent, {
      width: "600px"
    });

    dialogRef.afterClosed().subscribe(() => this.refreshInvitations());
  }

  openSignInDialog() {
    const signInDialog = this.dialog.open(SignInComponent, { width: "400px" });
    const signInSubscription = signInDialog.componentInstance.signedIn.subscribe(
      (signedIn: boolean) => {
        if (signedIn) {
          this.currentUser = this.authenticationService.currentUser;
          signInDialog.close();
        }
      }
    );

    signInDialog.afterClosed().subscribe((signedIn: boolean) => {
      signInSubscription.unsubscribe();
    });
  }

  openSignUpDialog() {
    const signUpDialog = this.dialog.open(SignUpComponent, { width: "400px" });
    const signUpSubscription = signUpDialog.componentInstance.signedUp.subscribe(
      (signedUp: boolean) => {
        if (signedUp) {
          this.currentUser = this.authenticationService.currentUser;
          signUpDialog.close();
        }
      }
    );

    signUpDialog.afterClosed().subscribe((signedUp: boolean) => {
      signUpSubscription.unsubscribe();
    });
  }

  signOut() {
    this.authenticationService.signOut();
    this.currentUser = null;
    window.location.href = "/";
  }
}

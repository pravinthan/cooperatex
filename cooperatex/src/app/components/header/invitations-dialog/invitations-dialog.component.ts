import { Component, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { Invitation } from "src/app/shared/models/invitation.model";
import { SocketService } from "src/app/shared/socket.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";

@Component({
  selector: "app-invitations-dialog",
  templateUrl: "./invitations-dialog.component.html",
  styleUrls: ["./invitations-dialog.component.css"],
})
export class InvitationsDialogComponent implements OnDestroy {
  onInvitationChangeSubscription: Subscription;
  invitations: Invitation[] = [];

  constructor(
    public dialogRef: MatDialogRef<InvitationsDialogComponent>,
    private projectService: ProjectService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {
    const refreshInvitations = () => {
      this.projectService
        .getInvitations()
        .toPromise()
        .then((invitations) => (this.invitations = invitations));
    };

    refreshInvitations();

    this.onInvitationChangeSubscription = this.socketService
      .onInvitationChange()
      .subscribe(() => {
        refreshInvitations();
      });
  }

  ngOnDestroy() {
    if (this.onInvitationChangeSubscription)
      this.onInvitationChangeSubscription.unsubscribe();
  }

  acceptInvitation(invitation: Invitation) {
    this.projectService
      .acceptInvitation(invitation.projectId)
      .toPromise()
      .then(() => {
        this.invitations = this.invitations.filter(
          (acceptedInvitation) =>
            acceptedInvitation.projectId != invitation.projectId
        );
        this.socketService.notifyCollaboratorChange(invitation.from);
        this.socketService.notifyProjectAvailabilityChange(invitation.to);
      })
      .catch((err) => {
        this.snackBar.open(
          "Error accepting invitation (it may have been revoked)",
          "OK",
          {
            duration: 3000,
          }
        );
      });
  }

  rejectInvitation(invitation: Invitation) {
    this.projectService
      .rejectInvitation(invitation.projectId)
      .toPromise()
      .then(() => {
        this.invitations = this.invitations.filter(
          (rejectedInvitation) =>
            rejectedInvitation.projectId != invitation.projectId
        );
        this.socketService.notifyCollaboratorChange(invitation.from);
        this.socketService.notifyProjectAvailabilityChange(invitation.to);
      })
      .catch((err) => {
        this.snackBar.open(
          "Error rejecting invitation (it may have already been revoked)",
          "OK",
          {
            duration: 3000,
          }
        );
      });
  }

  rejectAllInvitations() {
    this.invitations.forEach((invitation) => {
      this.rejectInvitation(invitation);
    });
  }
}

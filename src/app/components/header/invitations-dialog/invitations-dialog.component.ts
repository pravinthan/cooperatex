import { Component, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { Invitation } from "src/app/shared/models/invitation.model";
import { SocketService } from "src/app/shared/socket.service";
import { Subscription } from "rxjs";
import { NOTYF } from "src/app/shared/utils/notyf.token";
import { Notyf } from "notyf";

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
    @Inject(NOTYF) private notyf: Notyf,
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
        this.notyf.error("Error accepting invitation");
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
        this.notyf.error("Error rejecting invitation");
      });
  }

  rejectAllInvitations() {
    this.invitations.forEach((invitation) => {
      this.rejectInvitation(invitation);
    });
  }
}

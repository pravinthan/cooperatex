import { Component, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { MatTableDataSource } from "@angular/material/table";
import { SocketService } from "src/app/shared/socket.service";
import { Subscription } from "rxjs";
import { Collaborator } from "src/app/shared/models/collaborator.model";
import { User } from "src/app/shared/models/user.model";
import { NOTYF } from "src/app/shared/utils/notyf.token";
import { Notyf } from "notyf";

@Component({
  selector: "app-invite-collaborators-dialog",
  templateUrl: "./invite-collaborators-dialog.component.html",
  styleUrls: ["./invite-collaborators-dialog.component.css"],
})
export class InviteCollaboratorsDialogComponent implements OnDestroy {
  displayedColumns: string[] = ["username", "access", "action"];
  dataSource = new MatTableDataSource<Collaborator>();
  collaborators: Collaborator[] = [];
  onCollaboratorChangeSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<InviteCollaboratorsDialogComponent>,
    private projectService: ProjectService,
    private socketService: SocketService,
    @Inject(NOTYF) private notyf: Notyf,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      projectId: string;
      projectTitle: string;
    }
  ) {
    const refreshCollaborators = () => {
      this.projectService
        .getCollaborators(this.data.projectId)
        .toPromise()
        .then((collaborators) => {
          this.collaborators = collaborators;
          this.dataSource.data = this.collaborators;
        });
    };

    refreshCollaborators();

    this.onCollaboratorChangeSubscription = this.socketService
      .onCollaboratorChange()
      .subscribe(() => refreshCollaborators());
  }

  ngOnDestroy() {
    if (this.onCollaboratorChangeSubscription)
      this.onCollaboratorChangeSubscription.unsubscribe();
  }

  inviteCollaborator(username: string, access: "read" | "readWrite") {
    if (
      this.collaborators.find(
        (collaborator) => collaborator.user.username == username
      )
    ) {
      this.notyf.error(`Collaborator ${username} exists already`);
    } else {
      this.projectService
        .inviteCollaborator(this.data.projectId, username, access)
        .toPromise()
        .then((collaborator) => {
          this.collaborators.push(collaborator);
          this.dataSource.data = this.collaborators;
          this.socketService.notifyInvitationChange(collaborator.user);
          this.socketService.notifyProjectAvailabilityChange(collaborator.user);
        })
        .catch((err) => {
          this.notyf.error(`User ${username} does not exist`);
        });
    }
  }

  removeCollaborator(user: User) {
    if (
      !this.collaborators.find(
        (collaborator) => collaborator.user._id == user._id
      )
    ) {
      this.notyf.error(`Collaborator does not exist`);
    } else {
      this.projectService
        .removeCollaborator(this.data.projectId, user._id)
        .toPromise()
        .then(() => {
          this.collaborators = this.collaborators.filter(
            (collaborator) => collaborator.user._id != user._id
          );
          this.dataSource.data = this.collaborators;
          this.socketService.notifyInvitationChange(user);
          this.socketService.notifyProjectAvailabilityChange(user);
        })
        .catch((err) => {
          this.notyf.error(`Error removing collaborator ${user.username}`);
        });
    }
  }
}

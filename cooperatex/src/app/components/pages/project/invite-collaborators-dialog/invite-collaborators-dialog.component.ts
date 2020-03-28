import { Component, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Collaborator } from "src/app/shared/models/Project.model";
import { MatTableDataSource } from "@angular/material/table";
import { SocketService } from "src/app/shared/socket.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-invite-collaborators-dialog",
  templateUrl: "./invite-collaborators-dialog.component.html",
  styleUrls: ["./invite-collaborators-dialog.component.css"]
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
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      projectId: string;
      projectTitle: string;
    }
  ) {
    const getCollaborators = () => {
      this.projectService
        .getCollaborators(this.data.projectId)
        .toPromise()
        .then(collaborators => {
          this.collaborators = collaborators;
          this.dataSource.data = this.collaborators;
        });
    };

    getCollaborators();

    this.socketService.onCollaboratorChange().subscribe(() => {
      getCollaborators();
    });
  }

  ngOnDestroy() {
    if (this.onCollaboratorChangeSubscription)
      this.onCollaboratorChangeSubscription.unsubscribe();
  }

  inviteCollaborator(username: string, access: "read" | "readWrite") {
    if (
      this.collaborators.find(
        collaborator => collaborator.user.username == username
      )
    ) {
      this.snackBar.open(`Collaborator ${username} exists already`, "OK", {
        duration: 3000
      });
    } else {
      this.projectService
        .inviteCollaborator(this.data.projectId, username, access)
        .toPromise()
        .then(collaborator => {
          this.collaborators.push(collaborator);
          this.dataSource.data = this.collaborators;
          this.socketService.notifyInvitationChange(collaborator.user._id);
        })
        .catch(err => {
          this.snackBar.open(`User ${username} does not exist`, "OK", {
            duration: 3000
          });
        });
    }
  }

  removeCollaborator(id: string) {
    if (!this.collaborators.find(collaborator => collaborator.user._id == id)) {
      this.snackBar.open(`Collaborator does not exist`, "OK", {
        duration: 3000
      });
    } else {
      this.projectService
        .removeCollaborator(this.data.projectId, id)
        .toPromise()
        .then(() => {
          this.collaborators = this.collaborators.filter(
            collaborator => collaborator.user._id != id
          );
          this.dataSource.data = this.collaborators;
          this.socketService.notifyInvitationChange(id);
        })
        .catch(err => {
          this.snackBar.open(`Error removing collaborator`, "OK", {
            duration: 3000
          });
        });
    }
  }
}

import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Collaborator } from "src/app/shared/models/Project.model";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: "app-share-project-dialog",
  templateUrl: "./share-project-dialog.component.html",
  styleUrls: ["./share-project-dialog.component.css"]
})
export class ShareProjectDialogComponent {
  displayedColumns: string[] = ["username", "access", "action"];
  dataSource = new MatTableDataSource<Collaborator>();

  constructor(
    public dialogRef: MatDialogRef<ShareProjectDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: { projectId: string; collaborators: Collaborator[] }
  ) {
    this.dataSource.data = this.data.collaborators;

    this.dialogRef.beforeClosed().subscribe(() => {
      this.dialogRef.close(this.data.collaborators);
    });
  }

  inviteCollaborator(username: string, access: "read" | "readWrite") {
    if (
      this.data.collaborators.find(
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
          this.data.collaborators.push(collaborator);
          this.dataSource.data = this.data.collaborators;
        })
        .catch(err => {
          this.snackBar.open(`User ${username} does not exist`, "OK", {
            duration: 3000
          });
        });
    }
  }

  removeCollaborator(id: string) {
    if (
      !this.data.collaborators.find(collaborator => collaborator.user._id == id)
    ) {
      this.snackBar.open(`Collaborator does not exist`, "OK", {
        duration: 3000
      });
    } else {
      this.projectService
        .removeCollaborator(this.data.projectId, id)
        .toPromise()
        .then(() => {
          this.data.collaborators = this.data.collaborators.filter(
            collaborator => collaborator.user._id != id
          );
          this.dataSource.data = this.data.collaborators;
        })
        .catch(err => {
          this.snackBar.open(`Error removing collaborator`, "OK", {
            duration: 3000
          });
        });
    }
  }
}

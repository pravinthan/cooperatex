import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-delete-project-dialog",
  templateUrl: "./delete-project-dialog.component.html"
})
export class DeleteProjectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteProjectDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onSubmit() {
    this.projectService.createProject(this.data.id).subscribe(
      data => {
        this.dialogRef.close();
      },
      error => {
        this.snackBar.open("Failed to delete project", "OK", {
          duration: 3000
        });
      }
    );
  }

}

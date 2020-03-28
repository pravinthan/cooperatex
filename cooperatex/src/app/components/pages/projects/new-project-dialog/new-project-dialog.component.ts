import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

@Component({
  selector: "app-new-project-dialog",
  templateUrl: "./new-project-dialog.component.html",
  styleUrls: ["./new-project-dialog.component.css"]
})
export class NewProjectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    this.projectService.createProject(form.value.title).subscribe(
      data => {
        this.dialogRef.close();
        this.router.navigate([`/projects/${data._id}`]);
      },
      error => {
        this.snackBar.open("Failed to create project, try again later.", "OK", {
          duration: 3000
        });
      }
    );
  }
}

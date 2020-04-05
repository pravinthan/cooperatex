import { Component, Inject } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService } from "src/app/shared/project.service";
import { Router } from "@angular/router";
import { Notyf } from "notyf";
import { NOTYF } from "src/app/shared/utils/notyf.token";

@Component({
  selector: "app-new-project-dialog",
  templateUrl: "./new-project-dialog.component.html",
  styleUrls: ["./new-project-dialog.component.css"],
})
export class NewProjectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    private projectService: ProjectService,
    @Inject(NOTYF) private notyf: Notyf,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    this.projectService.createProject(form.value.title).subscribe(
      (data) => {
        this.dialogRef.close();
        this.router.navigate([`/projects/${data._id}`]);
      },
      (error) => {
        this.notyf.error("Failed to create project, try again later.");
      }
    );
  }
}

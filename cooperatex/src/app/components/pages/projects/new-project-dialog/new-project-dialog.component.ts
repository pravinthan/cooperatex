import { Component, Inject } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService, LatexTemplate } from "src/app/shared/project.service";
import { Router } from "@angular/router";
import { Notyf } from "notyf";
import { NOTYF } from "src/app/shared/utils/notyf.token";

interface RadioButtonTemplate {
  title: string;
  value: string;
  checked: boolean;
}

@Component({
  selector: "app-new-project-dialog",
  templateUrl: "./new-project-dialog.component.html",
  styleUrls: ["./new-project-dialog.component.css"],
})
export class NewProjectDialogComponent {
  templates: RadioButtonTemplate[] = [
    {
      title: "Blank",
      value: "default",
      checked: true,
    },
    {
      title: "Cover Letter",
      value: "cover-letter",
      checked: false,
    },
    {
      title: "Academic Title Page",
      value: "title-page",
      checked: false,
    },
    {
      title: "TBD",
      value: "TBD",
      checked: false,
    },
  ];
  selectedTemplate: LatexTemplate = "default";

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialogComponent>,
    private projectService: ProjectService,
    @Inject(NOTYF) private notyf: Notyf,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    this.projectService
      .createProject(form.value.title, this.selectedTemplate)
      .subscribe(
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

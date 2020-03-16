import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'app-edit-file-name-dialog',
  templateUrl: './edit-file-name-dialog.component.html',
  styleUrls: ['./edit-file-name-dialog.component.css']
})
export class EditFileNameDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<EditFileNameDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) {}

  onSubmit(form: NgForm) {
    this.projectService.editFileName(this.data.projectId, this.data.fileId, form.value.title).subscribe(
      data => {
        this.dialogRef.close();
      },
      error => {
        this.snackBar.open("Failed to create project, try again later.", "OK", {
          duration: 3000
        });
      }
    );
  }

}

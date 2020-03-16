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

    this.projectService
    .patchFile(this.data.projectId, this.data.fileId, "replaceName", form.value.title).subscribe(
      data => {
        this.dialogRef.close(form.value.title);
      },
      error => {
        this.snackBar.open("File name exists already.", "OK", {
          duration: 3000
        });
      }
    );
  }

}

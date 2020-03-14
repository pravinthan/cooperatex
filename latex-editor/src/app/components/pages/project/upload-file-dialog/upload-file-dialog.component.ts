import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

@Component({
  selector: 'app-upload-file-dialog',
  templateUrl: './upload-file-dialog.component.html',
  styleUrls: ['./upload-file-dialog.component.css']
})
export class UploadFileDialogComponent {

  fileToUpload: File = null;

  constructor(
    public dialogRef: MatDialogRef<UploadFileDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,

  ) { }

  handleFileInput(files: FileList) {
    this.fileToUpload = files[0];
  }

  uploadFile() {
    if (!this.fileToUpload) {
      this.snackBar.open("No file uploaded", "OK", {
        duration: 3000
      });
    } else {

      this.projectService.postFile(this.fileToUpload).subscribe(data => {
        this.dialogRef.close();
      }, error => {
        console.log(error);
      });

    }
  }


}


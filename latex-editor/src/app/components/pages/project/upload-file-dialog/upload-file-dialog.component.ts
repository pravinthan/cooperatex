import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-upload-file-dialog",
  templateUrl: "./upload-file-dialog.component.html",
  styleUrls: ["./upload-file-dialog.component.css"]
})
export class UploadFileDialogComponent {
  filesToUpload: File[] = [];
  inputLabel: string = "Choose a file";

  constructor(
    public dialogRef: MatDialogRef<UploadFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private projectService: ProjectService,
    public snackBar: MatSnackBar
  ) {}

  handleFileInput(files: FileList) {
    // Convert FileList to array
    let filesArray = [];
    for (let i = 0; i < files.length; i++) {
      filesArray.push(files.item(i));
    }

    for (let i = filesArray.length - 1; i >= 0; i--) {
      const file = files[i];
      if (file.size > 20971520) {
        this.snackBar.open(
          `${file.name} is too big, max file size is 20MB`,
          "OK",
          {
            duration: 3000
          }
        );

        filesArray.splice(i, 1);
      }
    }

    // Update file input label
    this.inputLabel = "Choose a file";
    if (filesArray.length == 1) this.inputLabel = filesArray[0].name;
    else if (filesArray.length > 1)
      this.inputLabel = filesArray.length + " files selected";

    this.filesToUpload = filesArray;
  }

  uploadFile() {
    this.projectService
      .createFile(this.data.projectId, this.filesToUpload[0])
      .subscribe(file => {
        this.dialogRef.close(file);
      });
  }
}

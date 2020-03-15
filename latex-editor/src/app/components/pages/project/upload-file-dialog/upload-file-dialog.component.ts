import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";

@Component({
  selector: "app-upload-file-dialog",
  templateUrl: "./upload-file-dialog.component.html",
  styleUrls: ["./upload-file-dialog.component.css"]
})
export class UploadFileDialogComponent {
  fileToUpload: File = null;

  constructor(
    public dialogRef: MatDialogRef<UploadFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private projectService: ProjectService
  ) {}

  handleFileInput(files: File[]) {
    this.fileToUpload = files[0];
  }

  uploadFile() {
    this.projectService
      .createFile(this.data.projectId, this.fileToUpload)
      .subscribe(file => {
        this.dialogRef.close(file);
      });
  }
}

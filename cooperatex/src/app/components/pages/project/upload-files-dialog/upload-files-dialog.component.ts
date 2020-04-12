import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { NOTYF } from "src/app/shared/utils/notyf.token";
import { Notyf } from "notyf";

@Component({
  selector: "app-upload-files-dialog",
  templateUrl: "./upload-files-dialog.component.html",
  styleUrls: ["./upload-files-dialog.component.css"],
})
export class UploadFilesDialogComponent {
  filesToUpload: File[] = [];
  inputLabel: string = "Choose files";

  constructor(
    public dialogRef: MatDialogRef<UploadFilesDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { projectId: string; fileNames: string },
    private projectService: ProjectService,
    @Inject(NOTYF) private notyf: Notyf
  ) {}

  handleInput(files: FileList) {
    this.notyf.dismissAll();

    // Convert FileList to array
    let filesArray: File[] = [];
    for (let i = 0; i < files.length; i++) {
      filesArray.push(files.item(i));
    }

    let largeFiles: File[] = [];
    let longNameFiles: File[] = [];
    let existingFiles: File[] = [];
    filesArray = filesArray.filter((file) => {
      if (file.size > 20971520) {
        largeFiles.push(file);
        return false;
      } else if (file.name.length > 50) {
        longNameFiles.push(file);
        return false;
      } else if (this.data.fileNames.includes(file.name)) {
        existingFiles.push(file);
        return false;
      }

      return true;
    });

    // Show messages for respective errors
    if (existingFiles.length > 0) {
      this.notyf.error(
        `${existingFiles.length} ${
          existingFiles.length == 1
            ? "file already exists"
            : "files already exist"
        }`
      );
    } else if (largeFiles.length > 0) {
      this.notyf.error(
        `${largeFiles.length} ${
          largeFiles.length == 1 ? "file is" : "files are"
        } too large (Maximum file size is 20MB)`
      );
    } else if (longNameFiles.length > 0) {
      this.notyf.error(
        `${longNameFiles.length} ${
          longNameFiles.length == 1 ? "file has a name" : "files have names"
        } longer than 50 characters`
      );
    }

    // Update file input label
    this.inputLabel = "Choose files";
    if (filesArray.length == 1) this.inputLabel = filesArray[0].name;
    else if (filesArray.length > 1)
      this.inputLabel = filesArray.length + " files selected";

    this.filesToUpload = filesArray;
  }

  uploadFiles() {
    this.projectService
      .uploadFiles(this.data.projectId, this.filesToUpload)
      .subscribe((files) => {
        this.dialogRef.close(files);
      });
  }
}

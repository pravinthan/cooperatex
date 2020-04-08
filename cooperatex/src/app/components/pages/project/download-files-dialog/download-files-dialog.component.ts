import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProjectService } from "src/app/shared/project.service";
import { Project } from "src/app/shared/models/project.model";
import { saveAs } from "file-saver";

@Component({
  selector: 'app-download-files-dialog',
  templateUrl: './download-files-dialog.component.html',
  styleUrls: ['./download-files-dialog.component.css']
})
export class DownloadFilesDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DownloadFilesDialogComponent>,
    private projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project }
  ) { }

  downloadOutputPdf() {
    this.projectService
      .getOutputFile(this.data.project._id)
      .toPromise()
      .then(outputPdf => {
        const blob = new Blob([outputPdf], {type: "application/pdf"});
        saveAs(blob, this.data.project.title + '.pdf');
      });
  }

  downloadAllFiles(){
    this.projectService.getZipFile(this.data.project._id).toPromise().then(file => {
      const blob = new Blob([file], {type: "application/zip"});
      saveAs(blob, this.data.project.title + '.zip');

    });
  }

}

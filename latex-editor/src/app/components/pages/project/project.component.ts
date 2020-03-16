import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import * as CodeMirror from "codemirror";
import { ProjectService } from "src/app/shared/project.service";
import { MatDialog } from "@angular/material/dialog";
import { UploadFilesDialogComponent } from "./upload-files-dialog/upload-files-dialog.component";
import { EditFileNameDialogComponent } from "./edit-file-name-dialog/edit-file-name-dialog.component";
import { DeleteFileDialogComponent } from "./delete-file-dialog/delete-file-dialog.component";
import { ActivatedRoute, Router } from "@angular/router";
import { MulterFile } from "src/app/shared/models/Project.model";
import { PdfJsViewerComponent } from "ng2-pdfjs-viewer";

interface DisplayFile {
  _id: string;
  fileName: string;
  mimeType: string;
  isMain: boolean;
  isImage: boolean;
  canMain: boolean;
}

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"]
})
export class ProjectComponent implements OnInit, AfterViewInit {
  @ViewChild("editor") private editor;
  @ViewChild("pdfViewer") pdfViewer: PdfJsViewerComponent;
  projectTitle: string;
  projectId: string;
  displayFiles: DisplayFile[] = [];
  initialLoading = true;
  latex: string;
  get mainFile() {
    return this.displayFiles.find(displayFile => displayFile.isMain);
  }

  constructor(
    private projectService: ProjectService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  private convertFileToDisplayFile(file: MulterFile) {
    const displayFile: DisplayFile = {
      _id: file._id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      isMain: file.isMain,
      isImage: /^image\/(jpeg|png)$/i.test(file.mimetype),
      canMain: /^application\/(octet-stream|x-tex|x-latex)$/i.test(
        file.mimetype
      )
    };

    return displayFile;
  }

  // Link the main file to the editor
  private setEditorContentToMainFile() {
    const mainFile = this.mainFile;

    if (mainFile) {
      this.projectService
        .getFileStream(this.projectId, mainFile._id)
        .subscribe(fileStream => {
          this.initialLoading = false;
          new Response(fileStream).text().then(text => {
            this.latex = text;
            this.editor.codeMirror.setSize("100%", "100%");
          });
        });

      this.compilePdf();
    } else {
      this.initialLoading = false;
      this.latex = "";
    }
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get("id");
    this.projectService
      .getProjectById(this.projectId)
      .toPromise()
      .then(project => {
        this.projectTitle = project.title;
        this.displayFiles = project.files.map(file =>
          this.convertFileToDisplayFile(file)
        );

        this.setEditorContentToMainFile();

        // Get each file's stream
        // this.displayFiles.forEach(displayFile => {
        //   this.projectService
        //     .getFileStream(this.projectId, displayFile._id)
        //     .subscribe(fileStream => {
        //       // console.log(file);
        //     });
        // });
      })
      .catch(err => {
        console.log(err);
        // this.router.navigate(["/404"]);
      });
  }

  ngAfterViewInit() {
    // const codeMirror = this.editor.codeMirror;
    // codeMirror.setSize("100%", "100%");
    // let document = codeMirror.getDoc();
  }

  openUploadFilesDialog() {
    let dialogRef = this.dialog.open(UploadFilesDialogComponent, {
      width: "400px",
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe((files: MulterFile[]) => {
      if (files && files.length > 0) {
        this.displayFiles = [];
        files.forEach(file => {
          this.displayFiles.push(this.convertFileToDisplayFile(file));

          this.projectService
            .getFileStream(this.projectId, file._id)
            .subscribe(fileStream => {
              // console.log(file);
            });
        });
      }
    });
  }

  deleteFile(fileId: string, fileName: string) {
    let dialogRef = this.dialog.open(DeleteFileDialogComponent, {
      width: "400px",
      data: { title: fileName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.projectService
          .deleteFile(this.projectId, fileId)
          .toPromise()
          .then(() => {
            this.displayFiles = this.displayFiles.filter(
              displayFile => displayFile._id != fileId
            );

            this.setEditorContentToMainFile();
          });
      }
    });
  }

  editFileTitle(fileId: string) {
    let dialogRef = this.dialog.open(EditFileNameDialogComponent, {
      width: "400px",
      data: {
        projectId: this.projectId,
        fileId: fileId,
        displayFiles: this.displayFiles
      }
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName) {
        const newNameIndex = this.displayFiles.findIndex(
          displayFile => displayFile._id == fileId
        );
        const suffix = this.displayFiles[newNameIndex].fileName.substring(
          this.displayFiles[newNameIndex].fileName.indexOf(".")
        );
        this.displayFiles[newNameIndex].fileName = newName + suffix;
      }
    });
  }

  markAsMain(fileId: string) {
    this.projectService
      .patchFile(this.projectId, fileId, "replaceMain")
      .toPromise()
      .then(() => {
        const oldMainIndex = this.displayFiles.findIndex(
          displayFile => displayFile.isMain
        );
        const newMainIndex = this.displayFiles.findIndex(
          displayFile => displayFile._id == fileId
        );

        if (oldMainIndex != -1) {
          this.displayFiles[oldMainIndex].canMain = true;
          this.displayFiles[oldMainIndex].isMain = false;
        }
        this.displayFiles[newMainIndex].canMain = false;
        this.displayFiles[newMainIndex].isMain = true;

        this.setEditorContentToMainFile();
      });
  }

  trackFile(index: number, item: DisplayFile) {
    return item._id;
  }

  compilePdf() {
    this.projectService
      .getOutputFile(this.projectId)
      .toPromise()
      .then(outputPdf => {
        this.pdfViewer.pdfSrc = outputPdf;
        this.pdfViewer.refresh();
      });
  }

  downloadOutputPdf() {
    this.projectService
      .getOutputFile(this.projectId)
      .toPromise()
      .then(outputPdf => {
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(outputPdf);
        link.click();
      });
  }
}

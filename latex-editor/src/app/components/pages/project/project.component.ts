import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import * as CodeMirror from "codemirror";
import { ProjectService } from "src/app/shared/project.service";
import { MatDialog } from "@angular/material/dialog";
import { UploadFilesDialogComponent } from "./upload-files-dialog/upload-files-dialog.component";
import { EditFileNameDialogComponent } from "./edit-file-name-dialog/edit-file-name-dialog.component"
import { ActivatedRoute, Router } from "@angular/router";
import { MulterFile } from "src/app/shared/models/Project.model";

interface DisplayFile {
  _id: string;
  fileName: string;
  mimeType: string;
  isImage: boolean;
}

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"]
})
export class ProjectComponent implements OnInit, AfterViewInit {
  projectTitle: string;
  projectId: string;
  displayFiles: DisplayFile[] = [];
  @ViewChild("editor") private editor;
  latex: string;

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
      isImage: /^image\/(jpeg|png)$/i.test(file.mimetype)
    };

    return displayFile;
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

        // Get each file's stream
        this.displayFiles.forEach(displayFile => {
          this.projectService
            .getFileStream(this.projectId, displayFile._id)
            .subscribe(fileStream => {
              // console.log(file);
            });
        });
      })
      .catch(err => {
        this.router.navigate(["/404"]);
      });

    this.latex = "qwe";
  }

  ngAfterViewInit() {
    const codeMirror = this.editor.codeMirror;
    codeMirror.setSize("100%", "100%");

    let document = codeMirror.getDoc();
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

  deleteFile(fileId: string) {
    // let dialogRef = this.dialog.open(DeleteFileDialogComponent, {
    //   width: "400px",
    //   data: { projectId: this.projectId }
    // });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    this.projectService
      .deleteFile(this.projectId, fileId)
      .toPromise()
      .then(() => {
        this.displayFiles = this.displayFiles.filter(
          displayFile => displayFile._id != fileId
        );
      });
    //     });
  }


  editFileTitle(fileId: string){
    let dialogRef = this.dialog.open(EditFileNameDialogComponent, {
      width: "400px",
      data: { 
              projectId: this.projectId,
              fileId: fileId, 
              displayFiles: this.displayFiles 
            }
    });


  }

  trackFile(index: number, item: DisplayFile) {
    return item._id;
  }
}

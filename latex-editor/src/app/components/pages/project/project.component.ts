import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import * as CodeMirror from "codemirror";
import { ProjectService } from "src/app/shared/project.service";
import { MatDialog } from "@angular/material/dialog";
import { UploadFileDialogComponent } from "./upload-file-dialog/upload-file-dialog.component";
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

  private convertFilesToDisplayFiles(files: MulterFile[]) {
    for (let file of files) {
      this.displayFiles.push({
        _id: file._id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        isImage: /^image\/(jpeg|png)$/i.test(file.mimetype)
      });
    }
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get("id");
    this.projectService
      .getProjectById(this.projectId)
      .toPromise()
      .then(project => {
        this.projectTitle = project.title;
        this.convertFilesToDisplayFiles(project.files);

        // Get each file's data
        this.displayFiles.forEach(displayFile => {
          this.projectService
            .getFileStream(this.projectId, displayFile._id)
            .subscribe(file => {
              console.log(file);
            });
        });
      })
      .catch(err => {
        console.log(err)
        // this.router.navigate(["/404"]);
      });

    this.latex = "qwe";
  }

  ngAfterViewInit() {
    const codeMirror = this.editor.codeMirror;
    codeMirror.setSize("100%", "100%");

    let document = codeMirror.getDoc();
  }

  openUploadFileDialog() {
    let dialogRef = this.dialog.open(UploadFileDialogComponent, {
      width: "400px",
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe((newFile: MulterFile) => {
      if (newFile)
        this.projectService
          .getAllFiles(this.projectId)
          .toPromise()
          .then(files => {
            this.convertFilesToDisplayFiles(files);

            this.projectService
              .getFileStream(this.projectId, newFile._id)
              .subscribe(file => {
                // console.log(file);
              });
          });
    });
  }
}

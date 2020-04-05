import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  OnDestroy,
} from "@angular/core";
import { ProjectService } from "src/app/shared/project.service";
import { MatDialog } from "@angular/material/dialog";
import { UploadFilesDialogComponent } from "./upload-files-dialog/upload-files-dialog.component";
import { RenameFileDialogComponent } from "./rename-file-dialog/rename-file-dialog.component";
import { DeleteFileDialogComponent } from "./delete-file-dialog/delete-file-dialog.component";
import { ActivatedRoute, Router } from "@angular/router";
import { Project } from "src/app/shared/models/Project.model";
import { MulterFile } from "src/app/shared/models/multer-file.model";
import { PdfJsViewerComponent } from "ng2-pdfjs-viewer";
import { CodemirrorComponent } from "@ctrl/ngx-codemirror";
import { InviteCollaboratorsDialogComponent } from "./invite-collaborators-dialog/invite-collaborators-dialog.component";
import { SocketService } from "src/app/shared/socket.service";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { User } from "src/app/shared/models/user.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";

export class DisplayFile {
  _id: string;
  fileName: string;
  mimeType: string;
  isMain: boolean;
  isImage: boolean;
  canMain: boolean;
}

type Colour =
  | "red"
  | "orange"
  | "green"
  | "violet"
  | "yellow"
  | "darkcyan"
  | "salmon"
  | "lightblue"
  | "springgreen"
  | "white";

class ColourHandler {
  private availableColours: Colour[] = [
    "red",
    "orange",
    "green",
    "violet",
    "yellow",
    "darkcyan",
    "salmon",
    "lightblue",
    "springgreen",
    "white",
  ];
  private nextColourIndex = 0;

  getNextColour() {
    const currentColourIndex = this.nextColourIndex;
    this.nextColourIndex = Math.min(
      this.nextColourIndex + 1,
      this.availableColours.length - 1
    );

    return this.availableColours[currentColourIndex];
  }

  decrementColour() {
    this.nextColourIndex = Math.max(this.nextColourIndex - 1, 0);
  }
}

class LiveCollaborator {
  user: User;
  colour: Colour;
}

class CollaboratorCursor {
  user: User;
  cursor: CodeMirror.TextMarker;
}

class CollaboratorSelection {
  user: User;
  selection: CodeMirror.TextMarker;
}

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"],
})
export class ProjectComponent implements OnInit, OnDestroy {
  @ViewChild("editor") editor: CodemirrorComponent;
  @ViewChild("pdfViewer") pdfViewer: PdfJsViewerComponent;
  currentUser = this.authenticationService.currentUser;
  projectId: string;
  project: Project;
  displayFiles: DisplayFile[] = [];
  initialLoading = true;
  latexErrorLog: string;
  mainLatexError: string;
  showErrorLog = false;
  autoCompile = true;
  compiling = false;
  colourHandler = new ColourHandler();
  liveCollaborators: LiveCollaborator[] = [];
  collaboratorCursors: CollaboratorCursor[] = [];
  collaboratorSelections: CollaboratorSelection[] = [];
  onJoinedProjectSessionSubscription: Subscription;
  onLeftProjectSessionSubscription: Subscription;
  onFileContentsChangeSubscription: Subscription;
  onCursorChangeSubscription: Subscription;
  onSelectionChangeSubscription: Subscription;
  onActiveUserIdsInProjectSessionSubscription: Subscription;
  onProjectChangeSubscription: Subscription;
  onProjectAvailabilityChangeSubscription: Subscription;
  get mainFile() {
    return this.displayFiles.find((displayFile) => displayFile.isMain);
  }
  get hasReadWriteAccess() {
    const collaborator = this.project.collaborators.find(
      (collaborator) => collaborator.user._id == this.currentUser._id
    );

    return (
      this.currentUser._id == this.project.owner._id ||
      (collaborator &&
        collaborator.acceptedInvitation &&
        collaborator.access == "readWrite")
    );
  }

  constructor(
    private projectService: ProjectService,
    private socketService: SocketService,
    private authenticationService: AuthenticationService,
    private snackBar: MatSnackBar,
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
      ),
    };

    return displayFile;
  }

  private updateLatex = (
    editor: CodeMirror.Editor,
    change: CodeMirror.EditorChange
  ) => {
    if (change.origin != "setValue" && this.hasReadWriteAccess) {
      const newContents = editor.getValue();
      this.socketService.notifyFileContentsChange(this.projectId, newContents);
      this.projectService
        .replaceFileContents(this.projectId, this.mainFile._id, newContents)
        .toPromise()
        .then(() => {
          if (this.autoCompile) this.compilePdf();
        });
    }
  };

  private onCursorActivity = (editor: CodeMirror.Editor) => {
    this.socketService.notifyCursorChange(this.projectId, {
      updatedBy: this.currentUser,
      cursorPos: editor.getCursor(),
    });

    const anchor = editor.getCursor("from");
    const head = editor.getCursor("to");
    if (anchor != head) {
      this.socketService.notifySelectionChange(this.projectId, {
        updatedBy: this.currentUser,
        from: anchor,
        to: head,
      });
    }
  };

  // Link the main file to the editor
  private setEditorContentToMainFile() {
    const mainFile = this.mainFile;

    if (mainFile) {
      this.projectService
        .getFileStream(this.projectId, mainFile._id)
        .toPromise()
        .then((fileStream) => {
          this.initialLoading = false;
          new Response(fileStream).text().then((text) => {
            this.editor.codeMirror.setValue(text);
            this.editor.codeMirror.setSize("100%", "100%");
            this.editor.codeMirror.on("change", this.updateLatex);
            this.editor.codeMirror.on("cursorActivity", this.onCursorActivity);
            this.compilePdf();
          });
        });
    } else {
      this.initialLoading = false;
    }
  }

  private removeSelection(liveCollaborator: LiveCollaborator) {
    const collaboratorSelectionIndex = this.collaboratorSelections.findIndex(
      (collaboratorSelection) =>
        collaboratorSelection.user._id == liveCollaborator.user._id
    );

    if (collaboratorSelectionIndex != -1) {
      this.collaboratorSelections[collaboratorSelectionIndex].selection.clear();
      this.collaboratorSelections.splice(collaboratorSelectionIndex, 1);
    }
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get("id");

    this.onJoinedProjectSessionSubscription = this.socketService
      .onJoinedProjectSession()
      .subscribe((user) => {
        this.snackBar.open(`${user.username} has joined the session`, null, {
          duration: 3000,
        });
      });

    this.onActiveUserIdsInProjectSessionSubscription = this.socketService
      .onActiveUserIdsInProjectSession()
      .subscribe((userIds) => {
        userIds.forEach((userId) => {
          if (this.currentUser._id != userId) {
            const collaborator = this.project.collaborators.find(
              (collaborator) => collaborator.user._id == userId
            );
            const user = collaborator ? collaborator.user : this.project.owner;

            if (
              user &&
              !this.liveCollaborators.find(
                (liveCollaborator) => liveCollaborator.user._id == user._id
              )
            )
              this.liveCollaborators.push({
                user,
                colour: this.colourHandler.getNextColour(),
              });
          }
        });
      });

    this.onLeftProjectSessionSubscription = this.socketService
      .onLeftProjectSession()
      .subscribe((user) => {
        this.liveCollaborators = this.liveCollaborators.filter(
          (liveCollaborator) => liveCollaborator.user._id != user._id
        );

        this.colourHandler.decrementColour();

        this.snackBar.open(`${user.username} has left the session`, null, {
          duration: 3000,
        });
      });

    this.onProjectChangeSubscription = this.socketService
      .onProjectChange()
      .subscribe(() => {
        this.projectService
          .getProjectById(this.projectId)
          .toPromise()
          .then((project) => {
            this.project = project;
            this.displayFiles = project.files.map((file) =>
              this.convertFileToDisplayFile(file)
            );
          });
      });

    this.projectService
      .getProjectById(this.projectId)
      .toPromise()
      .then((project) => {
        this.project = project;

        this.socketService.joinProjectSession(this.projectId, this.currentUser);

        this.displayFiles = project.files.map((file) =>
          this.convertFileToDisplayFile(file)
        );

        this.setEditorContentToMainFile();

        this.onFileContentsChangeSubscription = this.socketService
          .onFileContentsChange()
          .subscribe((newContents) => {
            // Save cursor position and current selection (if it exists)
            const anchor = this.editor.codeMirror.getCursor("from");
            const head = this.editor.codeMirror.getCursor();

            // Update contents
            this.editor.codeMirror.setValue(newContents);

            // Load cursor position and current selection
            this.editor.codeMirror.setCursor(head);
            this.editor.codeMirror.setSelection(anchor, head);
          });

        this.onCursorChangeSubscription = this.socketService
          .onCursorChange()
          .subscribe((cursorChange) => {
            const liveCollaborator = this.liveCollaborators.find(
              (liveCollaborator) =>
                liveCollaborator.user._id == cursorChange.updatedBy._id
            );

            if (liveCollaborator) {
              // Remove previous cursor
              const collaboratorCursorIndex = this.collaboratorCursors.findIndex(
                (collaboratorCursor) =>
                  collaboratorCursor.user._id == liveCollaborator.user._id
              );
              if (collaboratorCursorIndex != -1) {
                this.collaboratorCursors[
                  collaboratorCursorIndex
                ].cursor.clear();
                this.collaboratorCursors.splice(collaboratorCursorIndex, 1);
              }

              // Remove previous selection
              this.removeSelection(liveCollaborator);

              // Create collaborator's cursor
              const cursorCoords = this.editor.codeMirror.cursorCoords(
                cursorChange.cursorPos
              );

              let cursorElement = document.createElement("span");
              cursorElement.style.position = "absolute";
              cursorElement.style.borderLeftStyle = "solid";
              cursorElement.style.borderLeftWidth = "2px";
              cursorElement.style.borderLeftColor = liveCollaborator.colour;
              cursorElement.style.backgroundColor = liveCollaborator.colour;
              cursorElement.style.height = `${
                cursorCoords.bottom - cursorCoords.top
              }px`;
              cursorElement.classList.add("cursor");

              let cursorInfoElement = document.createElement("span");
              cursorInfoElement.style.position = "absolute";
              cursorInfoElement.style.bottom = cursorElement.style.height;
              cursorInfoElement.style.width = "auto";
              cursorInfoElement.style.backgroundColor = liveCollaborator.colour;
              cursorInfoElement.classList.add("cursor-animation");
              cursorInfoElement.innerText = liveCollaborator.user.username;

              let cursorContainer = document.createElement("span");
              cursorContainer.appendChild(cursorElement);
              cursorContainer.appendChild(cursorInfoElement);

              this.collaboratorCursors.push({
                user: liveCollaborator.user,
                cursor: this.editor.codeMirror.setBookmark(
                  cursorChange.cursorPos,
                  { widget: cursorContainer }
                ),
              });
            }
          });

        this.onSelectionChangeSubscription = this.socketService
          .onSelectionChange()
          .subscribe((selectionChange) => {
            const liveCollaborator = this.liveCollaborators.find(
              (liveCollaborator) =>
                liveCollaborator.user._id == selectionChange.updatedBy._id
            );

            if (liveCollaborator) {
              // Remove previous selection
              this.removeSelection(liveCollaborator);

              // Create collaborator's selection
              this.collaboratorSelections.push({
                user: liveCollaborator.user,
                selection: this.editor.codeMirror.markText(
                  selectionChange.from,
                  selectionChange.to,
                  { className: liveCollaborator.colour }
                ),
              });
            }
          });

        this.onProjectAvailabilityChangeSubscription = this.socketService
          .onProjectAvailabilityChange()
          .subscribe(() => {
            // Check to see if user still has access
            this.projectService
              .getAllFiles(this.projectId)
              .toPromise()
              .catch((err) => {
                this.snackBar.open(
                  `Your access to ${this.project.title} has been revoked`,
                  "OK",
                  { duration: 3000 }
                );

                this.router.navigate(["/"]);
              });
          });
      })
      .catch((err) => this.router.navigate(["/404"]));
  }

  @HostListener("window:beforeunload")
  beforeUnload() {
    this.socketService.leaveProjectSession(this.projectId, this.currentUser);
    return true;
  }

  ngOnDestroy() {
    if (this.onJoinedProjectSessionSubscription)
      this.onJoinedProjectSessionSubscription.unsubscribe();
    if (this.onActiveUserIdsInProjectSessionSubscription)
      this.onActiveUserIdsInProjectSessionSubscription.unsubscribe();
    if (this.onLeftProjectSessionSubscription)
      this.onLeftProjectSessionSubscription.unsubscribe();
    if (this.onProjectChangeSubscription)
      this.onProjectChangeSubscription.unsubscribe();
    if (this.onFileContentsChangeSubscription)
      this.onFileContentsChangeSubscription.unsubscribe();
    if (this.onCursorChangeSubscription)
      this.onCursorChangeSubscription.unsubscribe();
    if (this.onSelectionChangeSubscription)
      this.onSelectionChangeSubscription.unsubscribe();
    if (this.onProjectAvailabilityChangeSubscription)
      this.onProjectAvailabilityChangeSubscription.unsubscribe();
  }

  openInviteCollaboratorsDialog() {
    let dialogRef = this.dialog.open(InviteCollaboratorsDialogComponent, {
      width: "600px",
      data: {
        projectId: this.projectId,
        projectTitle: this.project.title,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.projectService
        .getCollaborators(this.projectId)
        .toPromise()
        .then((collaborators) => (this.project.collaborators = collaborators));
    });
  }

  openUploadFilesDialog() {
    let dialogRef = this.dialog.open(UploadFilesDialogComponent, {
      width: "400px",
      data: {
        projectId: this.projectId,
        fileNames: this.displayFiles.map((displayFile) => displayFile.fileName),
      },
    });

    dialogRef.afterClosed().subscribe((files: MulterFile[]) => {
      if (files && files.length > 0) {
        this.socketService.notifyProjectChange(this.projectId);

        this.projectService
          .getAllFiles(this.projectId)
          .toPromise()
          .then((files) => {
            this.displayFiles = [];
            files.forEach((file) => {
              this.displayFiles.push(this.convertFileToDisplayFile(file));
            });
          });
      }
    });
  }

  deleteFile(fileId: string, fileName: string) {
    let dialogRef = this.dialog.open(DeleteFileDialogComponent, {
      width: "400px",
      data: { fileName },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.projectService
          .deleteFile(this.projectId, fileId)
          .toPromise()
          .then(() => {
            this.socketService.notifyProjectChange(this.projectId);

            this.displayFiles = this.displayFiles.filter(
              (displayFile) => displayFile._id != fileId
            );

            this.setEditorContentToMainFile();
          });
      }
    });
  }

  renameFile(fileId: string, oldFileName: string) {
    let dialogRef = this.dialog.open(RenameFileDialogComponent, {
      width: "400px",
      data: {
        projectId: this.projectId,
        fileId: fileId,
        oldFileName,
        displayFiles: this.displayFiles,
      },
    });

    dialogRef.afterClosed().subscribe((newName) => {
      if (newName) {
        this.socketService.notifyProjectChange(this.projectId);

        const newNameIndex = this.displayFiles.findIndex(
          (displayFile) => displayFile._id == fileId
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
      .assignMainFile(this.projectId, fileId)
      .toPromise()
      .then(() => {
        this.socketService.notifyProjectChange(this.projectId);

        const oldMainIndex = this.displayFiles.findIndex(
          (displayFile) => displayFile.isMain
        );
        const newMainIndex = this.displayFiles.findIndex(
          (displayFile) => displayFile._id == fileId
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

  trackFile(index: number, displayFile: DisplayFile) {
    return displayFile._id;
  }

  compilePdf() {
    if (!this.compiling) {
      this.latexErrorLog = "";
      this.mainLatexError = "";
      this.compiling = true;
      this.projectService
        .getOutputFile(this.projectId)
        .toPromise()
        .then((outputPdf) => {
          this.pdfViewer.pdfSrc = outputPdf;
          this.pdfViewer.refresh();
        })
        .catch((err) => {
          new Response(err.error).text().then((text) => {
            this.latexErrorLog = text;
            const indexOfMainError = this.latexErrorLog.indexOf("!") + 1;
            this.mainLatexError = this.latexErrorLog.substring(
              indexOfMainError,
              this.latexErrorLog.indexOf("\n", indexOfMainError)
            );
          });
        })
        .finally(() => (this.compiling = false));
    }
  }

  downloadOutputPdf() {
    this.projectService
      .getOutputFile(this.projectId)
      .toPromise()
      .then((outputPdf) => {
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(outputPdf);
        link.click();
      });
  }
}

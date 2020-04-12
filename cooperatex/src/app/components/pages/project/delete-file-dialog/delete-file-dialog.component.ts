import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-delete-file-dialog",
  templateUrl: "./delete-file-dialog.component.html",
})
export class DeleteFileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileName: string }
  ) {}
}

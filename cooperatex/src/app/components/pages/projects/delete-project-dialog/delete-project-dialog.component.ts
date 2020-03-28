import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-delete-project-dialog",
  templateUrl: "./delete-project-dialog.component.html"
})
export class DeleteProjectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string }
  ) {}
}

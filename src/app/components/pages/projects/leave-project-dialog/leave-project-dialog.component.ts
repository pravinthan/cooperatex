import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-leave-project-dialog",
  templateUrl: "./leave-project-dialog.component.html",
})
export class LeaveProjectDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LeaveProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string }
  ) {}
}

import { Component } from "@angular/core";
import { SignInComponent } from "../pages/sign-in/sign-in.component";
import { MatDialog } from "@angular/material/dialog";
import { SignUpComponent } from "../pages/sign-up/sign-up.component";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"]
})
export class HeaderComponent {
  constructor(public dialog: MatDialog) {}

  openSignInDialog() {
    const dialogRef = this.dialog.open(SignInComponent, { width: "400px" });
  }

  openSignUpDialog() {
    const dialogRef = this.dialog.open(SignUpComponent);
  }
}

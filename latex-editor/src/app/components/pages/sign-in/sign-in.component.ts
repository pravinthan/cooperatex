import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthenticationService } from "src/app/shared/authentication.service";

@Component({
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.css"]
})
export class SignInComponent {
  loading = false;
  error: string;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(["/"]);
    }
  }

  signIn(form: NgForm) {
    this.loading = true;
    this.authenticationService
      .signIn(form.value.username, form.value.password)
      .subscribe(
        data => {
          this.router.navigate(["/projects"]);
        },
        error => {
          this.error = error;
          this.loading = false;
        }
      );
  }
}

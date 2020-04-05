import { Component, Output, EventEmitter } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.css"],
})
export class SignUpComponent {
  loading = false;
  @Output() signedUp = new EventEmitter();

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    if (this.authenticationService.currentUserValue)
      this.router.navigate(["/"]);
  }

  signUp(form: NgForm) {
    this.loading = true;
    this.authenticationService
      .signUp(form.value.username, form.value.password)
      .subscribe(
        (data) => {
          this.signedUp.emit(true);

          const returnUrl = this.route.snapshot.queryParams.returnUrl;
          if (returnUrl) this.router.navigate([returnUrl]);
          else this.router.navigate(["/projects"]);
        },
        (error) => {
          this.loading = false;

          const message =
            error.status == 409 ? error.error : "Sign up failed, try again.";
          this.snackBar.open(message, "OK", { duration: 3000 });
        }
      );
  }
}

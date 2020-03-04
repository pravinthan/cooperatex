import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthenticationService } from "src/app/shared/authentication.service";

@Component({
  selector: "app-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.css"]
})
export class SignUpComponent implements OnInit {
  loading = false;
  submitted = false;
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

  ngOnInit() {}

  signUp(form: NgForm) {
    this.submitted = true;
    this.loading = true;
    this.authenticationService
      .signUp(form.value.username, form.value.password)
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

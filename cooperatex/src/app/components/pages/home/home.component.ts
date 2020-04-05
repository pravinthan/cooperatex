import { Component } from "@angular/core";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    if (this.authenticationService.currentUserValue)
      this.router.navigateByUrl("/projects", { skipLocationChange: true });
  }
}

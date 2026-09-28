import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-installation',
  templateUrl: './installation.component.html',
  styleUrls: ['../services.component.scss'],
})
export class InstallationComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}

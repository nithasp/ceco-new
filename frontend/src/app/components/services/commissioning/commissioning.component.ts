import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-commissioning',
  templateUrl: './commissioning.component.html',
  styleUrls: ['../services.component.scss'],
})
export class CommissioningComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}

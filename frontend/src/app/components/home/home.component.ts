import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.scrollIntoViewPort();
  }

  scrollIntoViewPort() {
    const sections = document.querySelectorAll('section');

    function isInViewPort(elem: any) {
      let scrollTop = window.pageYOffset;
      let scrollBottom = scrollTop + window.innerHeight;
      let elemTop = elem.offsetTop;
      let elemBottom = elemTop + elem.offsetHeight;

      return scrollBottom >= elemTop + 50;
    }

    window.addEventListener('scroll', () => {
      sections.forEach((section: any) => {
        if (isInViewPort(section)) {
          section?.classList.add('active');
        } else {
          section?.classList.remove('active');
        }
      });
    });
  }
}

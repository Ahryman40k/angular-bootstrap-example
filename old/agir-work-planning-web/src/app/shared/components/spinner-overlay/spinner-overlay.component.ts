import { Component, OnInit } from '@angular/core';
import { SpinnerOverlayService } from './spinner-overlay.service';

@Component({
  selector: 'app-spinner-overlay',
  templateUrl: './spinner-overlay.component.html',
  styleUrls: ['./spinner-overlay.component.scss']
})
export class SpinnerOverlayComponent implements OnInit {
  public message: string;
  constructor(private readonly spinnerOverlayService: SpinnerOverlayService) {}
  public ngOnInit(): void {
    this.spinnerOverlayService.message$.subscribe(message => {
      this.message = message;
    });
  }
}

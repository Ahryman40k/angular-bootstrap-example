import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[vdmButton]'
})
export class ButtonDirective  implements OnInit {

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    const btn = this.elRef.nativeElement;
    this.renderer.addClass( btn, 'btn');
    this.renderer.addClass( btn, 'btn-squared');
    this.renderer.addClass( btn, 'btn-tertiary');
  }
}


@Directive({
  selector: '[vdmRaised]'
})
export class RaisedButtonDirective implements OnInit {

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    const btn = this.elRef.nativeElement;

    this.renderer.addClass( btn, 'btn');
    this.renderer.addClass( btn, 'btn-squared');
  }
}


@Directive({
  selector: '[vdmStroke]'
})
export class StrokeButtonDirective  implements OnInit {


  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    const btn = this.elRef.nativeElement;
    this.renderer.addClass( btn, 'btn');
    this.renderer.addClass( btn, 'btn-squared');
    this.renderer.addClass( btn, 'btn-secondary');
  }
}


@Directive({
  selector: '[color]'
})
export class ColorDirective  implements OnInit {

  @Input() color: 'primary' | 'accent' | 'warn' = 'primary'; 

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    const btn = this.elRef.nativeElement;

    if (this.color === 'primary') {   this.renderer.addClass( btn, 'btn-primary'); }
    if (this.color === 'warn') {   
      this.renderer.addClass( btn, 'btn-primary'); 
      this.renderer.addClass( btn, 'btn-danger'); 
    }
    
  }
}

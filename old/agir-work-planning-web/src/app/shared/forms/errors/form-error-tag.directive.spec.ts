import { FormErrorTagDirective } from './form-error-tag.directive';

describe('Form error tag directive', () => {
  let directive: FormErrorTagDirective;

  beforeEach(() => {
    directive = new FormErrorTagDirective();
  });

  it('should create', () => {
    void expect(directive).toBeTruthy();
  });

  it('should return true for class', () => {
    void expect(directive.classInvalidFeedback).toBeTruthy();
  });
});

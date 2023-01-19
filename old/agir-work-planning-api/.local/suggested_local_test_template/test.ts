// ==========================================
// Local "src/test.ts" test file.
// Ignored in Git.
// Can be launched in VSCode using the
// "Debug the 'src/test.ts' file"launch
// configuration.
//
// Rules OK here.
// tslint:disable:no-console
// tslint:disable:no-floating-promises
// ==========================================

(async () => {
  try {
    console.log('test 123');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();

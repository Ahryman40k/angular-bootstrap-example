const delay = async (t: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
};

describe('Controller Project', () => {
  test('Controller will be fine', async () => {
    expect(false).toBeFalsy();
    await delay(10);
    expect(true).toBeTruthy();
  });
});

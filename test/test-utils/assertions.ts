import { AssertionError } from "chai";

export const assertRevert = async (
  asyncFn: Promise<any>,
  reason: string,
  message: string
) => {
  try {
    await asyncFn;
  } catch (error) {
    if (!error.message.includes("revert")) {
      throw new AssertionError(
        `${message}. Expected to fail with 'revert', but failed with: ${error}`
      );
    }

    if (!error.message.includes(reason)) {
      throw new AssertionError(
        `${message}. Expected reason to be '${reason}', but failed with: ${error}`
      );
    }
    return;
  }

  throw new AssertionError(`${message}. Did not fail`);
};

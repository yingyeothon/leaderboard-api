import { requestToUpdateRank } from "../../src/actor";

test(`validate`, async () => {
  // Invalid serviceKey
  try {
    await requestToUpdateRank(``, ``, ``);
    fail();
  } catch (error) {
    expect(/Invalid serviceKey/.test(error.message)).toBe(true);
  }

  // Invalid user
  try {
    await requestToUpdateRank(`maybe-service`, ``, ``);
    fail();
  } catch (error) {
    expect(/Invalid payload/.test(error.message)).toBe(true);
  }

  // Empty score
  try {
    await requestToUpdateRank(`maybe-service`, `maybe-user`, ``);
    fail();
  } catch (error) {
    expect(/Invalid payload/.test(error.message)).toBe(true);
  }

  // Invalid score
  try {
    await requestToUpdateRank(`maybe-service`, `maybe-user`, `123abc`);
    fail();
  } catch (error) {
    expect(/Invalid payload/.test(error.message)).toBe(true);
  }
});

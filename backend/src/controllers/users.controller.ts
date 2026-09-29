import { Request, Response } from 'express';
import { changePasswordSchema, profileUpdateSchema } from '../schemas/auth.schema';
import { userService } from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { setRefreshCookie } from '../utils/refreshCookie';
import { currentUserId } from '../utils/request';
import { sendSuccess } from '../utils/response';
import { parse } from '../utils/validation';

// The id always comes from the verified token, so these routes can only ever change the caller's
// own account whatever the body says (OWASP API1)
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const changes = parse(profileUpdateSchema, req.body);
  sendSuccess(res, await userService.updateProfile(currentUserId(req), changes), 'Profile updated.');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(changePasswordSchema, req.body);

  // Changing the password ends every session, so a fresh pair is issued to keep this one signed in
  const { user, accessToken, refreshToken } = await userService.changeOwnPassword(
    currentUserId(req),
    input.currentPassword,
    input.newPassword,
  );
  setRefreshCookie(res, refreshToken);

  sendSuccess(res, { user, accessToken }, 'Password changed. Other sessions have been signed out.');
});

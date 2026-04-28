"use server";

import { authService } from "@/lib/repos/container";

export async function registerAction(prevState: unknown, formData: FormData) {
  return authService.register(prevState, formData);
}

export async function verifyAndRegisterAction(prevState: unknown, formData: FormData) {
  return authService.verifyAndRegister(prevState, formData);
}

export async function loginAction(prevState: unknown, formData: FormData) {
  return authService.login(prevState, formData);
}

export async function logoutAction() {
  return authService.logoutUser();
}

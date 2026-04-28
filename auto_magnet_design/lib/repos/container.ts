import { db } from "@/db";
import { createUserRepo, createVerificationTokenRepo } from "./userRepo";
import { createDesignRepo } from "./designRepo";
import { createOrderRepo } from "./orderRepo";
import { createPreferencesRepo } from "./preferencesRepo";
import { createAuthService } from "@/lib/services/authService";
import { createDesignService } from "@/lib/services/designService";
import { createEmailService } from "@/lib/services/emailService";
import { createPreferencesService } from "@/lib/services/preferencesService";
import { createOrdersService } from "@/lib/services/ordersService";
import { createWebhookService } from "@/lib/services/webhookService";
import { createTestService } from "@/lib/services/testService";

// Repos
export const userRepo = createUserRepo(db);
export const verificationTokenRepo = createVerificationTokenRepo(db);
export const designRepo = createDesignRepo(db);
export const orderRepo = createOrderRepo(db);
export const preferencesRepo = createPreferencesRepo(db);

// Services
export const authService = createAuthService({ userRepo, verificationTokenRepo });
export const designService = createDesignService({ designRepo, userRepo });
export const emailService = createEmailService({ userRepo });
export const preferencesService = createPreferencesService({ preferencesRepo });
export const ordersService = createOrdersService({ orderRepo });
export const webhookService = createWebhookService({ orderRepo, designRepo });
export const testService = createTestService({ userRepo });

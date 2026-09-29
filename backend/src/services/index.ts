import { AuditLogRepository } from '../repositories/auditLog.repository';
import { SiteDocumentRepository } from '../repositories/document.repository';
import { ExperienceRepository } from '../repositories/experience.repository';
import { HeaderRepository } from '../repositories/header.repository';
import { MediaRepository } from '../repositories/media.repository';
import { RecentProjectRepository } from '../repositories/recentProject.repository';
import { RecruitmentRepository } from '../repositories/recruitment.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { UserRepository } from '../repositories/user.repository';
import { createAuditService } from './audit.service';
import { createSiteDocumentService } from './document.service';
import { createExperienceService } from './experience.service';
import { createHeaderService } from './header.service';
import { createMediaService } from './media.service';
import { createRecentProjectService } from './recentProject.service';
import { createRecruitmentService } from './recruitment.service';
import { storage } from './storage';
import { createTokenService } from './token.service';
import { createUserService } from './user.service';

const auditLogs = new AuditLogRepository();
const documents = new SiteDocumentRepository();
const experiences = new ExperienceRepository();
const headers = new HeaderRepository();
const media = new MediaRepository();
const recentProjects = new RecentProjectRepository();
const recruitments = new RecruitmentRepository();
const refreshTokens = new RefreshTokenRepository();
const users = new UserRepository();

export const auditService = createAuditService({ auditLogs });
export const tokenService = createTokenService({ refreshTokens, users, audit: auditService });
export const userService = createUserService({ users, tokens: tokenService });
export const mediaService = createMediaService({ media, storage });

// Content services take the media service as their file lookup, so an attachment is checked to
// exist before its id is written to a content row
export const headerService = createHeaderService({ headers, files: mediaService });
export const recentProjectService = createRecentProjectService({ recentProjects, files: mediaService });
export const experienceService = createExperienceService({ experiences });
export const recruitmentService = createRecruitmentService({ recruitments });
export const documentService = createSiteDocumentService({ documents, files: mediaService });
